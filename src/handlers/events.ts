import {PostCreate, PostSubmit, AppInstall, AppUpgrade} from "@devvit/protos";
import {TriggerContext, OnTriggerEvent, ScheduledJobEvent} from "@devvit/public-api";
import {addPostToKvStore, clearOldPostsByAuthor, getPostsByAuthor} from "../helpers/kvStoreHelpers.js";
import {toNumberOrDefault, getLocaleFromString, hasPerformedActions, isContributor, isModerator, getRecommendedPlaceholdersFromPost, CustomDateformat, assembleRemovalReason, submitPostReply} from "devvit-helpers";
import {enUS} from "date-fns/locale";

export async function onPostCreate (event: OnTriggerEvent<PostCreate>, context: TriggerContext) {
    const authorId = event.author?.id;
    const authorName = event.author?.name;
    const postId = event.post?.id;
    const createdAt = event.post?.createdAt;
    const subredditName = event.subreddit?.name;
    if (!authorId || !postId || !createdAt || !subredditName || !authorName) {
        console.error(`Missing authorId (${authorId ?? ""}),
                               authorName (${authorName ?? ""}),
                               postId (${postId ?? ""}),
                               createdAt (${createdAt ?? ""}), or
                               subredditName (${subredditName ?? ""}) in onPostCreate`);
        return;
    }

    // Separately get each setting instead of getAll in order to delay the check on whether the post has already been removed.
    const quotaAmount = await context.settings.get<number>("quotaAmount");
    const quotaPeriod = await context.settings.get<number>("quotaPeriod");
    const ignoreAutoRemoved = await context.settings.get<boolean>("ignoreAutoRemoved");
    const ignoreModerators = await context.settings.get<boolean>("ignoreModerators");
    const ignoreContributors = await context.settings.get<boolean>("ignoreContributors");
    const quotaRemovalReason = await context.settings.get<string>("quotaRemovalReason") ?? "";
    const customDateformat: CustomDateformat = {
        dateformat: await context.settings.get<string>("customTimeformat") ?? "yyyy-MM-dd hh-mm-ss",
        timezone: await context.settings.get<string>("customTimezone") ?? "00:00",
        locale: getLocaleFromString(await context.settings.get<string>("customLocale") ?? "") ?? enUS,
    };
    if (!quotaAmount || !quotaPeriod) {
        console.error(`One of the app settings is invalid or undefined for ${subredditName}`);
        return;
    }

    // Ignore moderators and contributors?
    if (ignoreModerators && await isModerator(context.reddit, subredditName, authorName)) {
        console.log(`skipping moderator ${authorName}`);
        return;
    }
    if (ignoreContributors && await isContributor(context.reddit, subredditName, authorName)) {
        console.log(`skipping contributor ${authorName}`);
        return;
    }

    // Ignore posts that have already been actioned.
    // Oftentimes the post has been actioned, but isRemoved has not yet updated.
    const hasRemoveActioned = await hasPerformedActions(context.reddit, subredditName, postId, ["removelink", "spamlink"]);
    const post = await context.reddit.getPostById(postId);
    if (hasRemoveActioned || post.isRemoved()) {
        console.log(`skipping removed post ${postId} (hasRemoveActioned: ${hasRemoveActioned.toString()}, isRemoved: ${post.isRemoved().toString()})`);
        return;
    }

    // Get posts by the author from the kv store.
    const postsByAuthor = await getPostsByAuthor(context.kvStore, authorId);
    console.log(`postsByAuthor ${authorId}: ${JSON.stringify(postsByAuthor)}`);

    // Calculate the number of posts by the author in the quota period.
    const quotaPeriodStart = Date.now() - quotaPeriod * 60 * 60 * 1000;
    let postsByAuthorInQuotaPeriod = 0;
    for (const post in postsByAuthor) {
        if (post === postId) {
            continue;
        } else if (postsByAuthor[post] > quotaPeriodStart) {
            postsByAuthorInQuotaPeriod++;
        }
    }

    // Remove the post if the quota has been exceeded.
    if (postsByAuthorInQuotaPeriod >= quotaAmount) {
        console.log(`${postsByAuthorInQuotaPeriod} posts >= ${quotaAmount} quota for ${authorId}, removing ${postId}`);
        context.reddit.remove(postId, false).catch(e => console.error("context.reddit.remove failed in onPostCreate", e));
        if (quotaRemovalReason) {
            const placeholders = await getRecommendedPlaceholdersFromPost(post, customDateformat);
            const commentBody = assembleRemovalReason(
                {body: quotaRemovalReason},
                placeholders,
                {
                    "{{author_flair_text}}": event.post?.authorFlair?.text ?? "",
                    "{{author_flair_css_class}}": event.post?.authorFlair?.text ?? "",
                    "{{author_flair_template_id}}": event.post?.authorFlair?.text ?? "",
                    "{{quota_amount}}": quotaAmount.toString(),
                    "{{quota_period}}": quotaPeriod.toString(),
                }
            );
            await submitPostReply(context.reddit, postId, commentBody, true, true).catch(e => console.error("submitPostReply failed in onPostCreate", e));
        }
    } else {
        console.log(`${postsByAuthorInQuotaPeriod} posts < ${quotaAmount} quota for ${authorId}, not actioning ${postId}`);
        // We know the post hasn't been removed by us or someone else, so we can log it to the kv store if ignoreAutoRemoved is true.
        if (ignoreAutoRemoved) {
            console.log(`logging post in onPostCreate (ignoreAutoRemoved) ${postId}`);
            await addPostToKvStore(context.kvStore, authorId, postId, createdAt).catch(e => console.error("addPostToKvStore failed in onPostCreate", e));
        }
    }
}

export async function onPostSubmit (event: OnTriggerEvent<PostSubmit>, context: TriggerContext) {
    const authorId = event.author?.id;
    const postId = event.post?.id;
    const createdAt = event.post?.createdAt;
    if (!authorId || !postId || !createdAt) {
        console.error(`Missing authorId (${authorId ?? ""}), postId (${postId ?? ""}), or createdAt (${createdAt ?? ""}) in onPostSubmit`);
        return;
    }

    // Log the post to the kv store if ignoreAutoRemoved is false.
    // There's no need to check if the user is a moderator or contributor here because that's checked before any actioning in onPostCreate anyways.
    const ignoreAutoRemoved = await context.settings.get<boolean>("ignoreAutoRemoved");
    if (!ignoreAutoRemoved) {
        console.log(`logging post in onPostSubmit (!ignoreAutoRemoved) ${postId}`);
        addPostToKvStore(context.kvStore, authorId, postId, createdAt).catch(e => console.error("addPostToKvStore failed in onPostSubmit", e));
    }
}

export async function onAppChanged (_: OnTriggerEvent<AppInstall | AppUpgrade>, context: TriggerContext) {
    try {
        // Cancel any existing clearOldPosts jobs.
        console.log("Clearing existing clearOldPosts jobs");
        const scheduledJobs = await context.scheduler.listJobs();
        for (const job of scheduledJobs) {
            if (job.name === "clearOldPosts") {
                console.log(`Cancelling clearOldPosts job ${job.id}`);
                await context.scheduler.cancelJob(job.id);
            }
        }

        // Schedule a new clearOldPosts job for every 5 minutes.
        console.log("Scheduling new clearOldPosts job");
        const newJob = await context.scheduler.runJob({cron: "*/5 * * * *", name: "clearOldPosts", data: {}});
        console.log(`New clearOldPosts job scheduled ${newJob}`);
    } catch (e) {
        console.error("Failed to schedule clearOldPosts job on AppInstall", e);
        throw e;
    }
}

export async function onRunClearOldPosts (event: ScheduledJobEvent, context: TriggerContext) {
    console.log("running onRunClearOldPosts");

    // Clear posts older than the quota period from the kv store.
    // Default to the maximum of a week if the quota period is invalid (sometimes happens when the app is installed without hitting save on the settings page).
    const quotaPeriod = toNumberOrDefault(await context.settings.get<number>("quotaPeriod"), 168);

    const kvStoreKeys = await context.kvStore.list().catch(e => {
        console.error("context.kvStore.list failed in onRunClearOldPosts", e); return [];
    });
    kvStoreKeys.forEach(key => void clearOldPostsByAuthor(context.kvStore, key, quotaPeriod)
        .catch(e => console.error(`clearOldPostsByAuthor ${key} failed in onRunClearOldPosts`, e)));
}
