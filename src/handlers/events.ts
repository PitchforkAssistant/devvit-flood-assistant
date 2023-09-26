import {PostCreate, PostSubmit, AppInstall, AppUpgrade, PostDelete, ModAction} from "@devvit/protos";
import {TriggerContext, OnTriggerEvent, SetFlairOptions} from "@devvit/public-api";
import {addPostToKvStore, clearOldPostsByAuthor, getPostsByAuthor, removePostFromKvStore} from "../helpers/kvStoreHelpers.js";
import {getLocaleFromString, hasPerformedActions, isContributor, isModerator, getRecommendedPlaceholdersFromPost, assembleRemovalReason, submitPostReply, startSingletonJob, isCustomDateformat, getTimeDeltaInSeconds, validatePositiveNumber, isValidDate, safeFormatInTimeZone, Placeholder} from "devvit-helpers";
import {enUS} from "date-fns/locale";

export async function onPostCreate (event: OnTriggerEvent<PostCreate>, context: TriggerContext) {
    console.log(`running onPostCreate for ${event.post?.id ?? ""}`);

    const authorId = event.author?.id;
    const authorName = event.author?.name;
    const postId = event.post?.id;
    const createdAt = event.post?.createdAt;
    const subredditName = event.subreddit?.name;
    if (!authorId || !postId || !createdAt || !subredditName || !authorName) {
        throw new Error(`Missing authorId (${authorId ?? ""}), authorName (${authorName ?? ""}), postId (${postId ?? ""}), createdAt (${createdAt ?? ""}), or subredditName (${subredditName ?? ""}) in onPostCreate`);
    }

    // #region Fetch and validate settings
    /*
     * We are intentionally getting each setting individually instead of using context.settings.getAll().
     * That is because we want to intentionally delay the execution of the rest of the function.
     * The purpose of the delay is to let AutoModerator do its thing before we do ours, so that we don't remove posts that it would have removed anyway.
     *
     * This is a sneaky little trick because awaits on Devvit things do not count towards the execution time limit.
     * Meaning that we can effectively delay the execution of the rest of the function by a little.
     *
     * Also I'm aware that onPostCreate is already triggered some seconds after onPostSubmit,
     * but it only gurantees that certain checks by Reddit have been completed, but not necessarily AutoModerator.
     */
    console.log(`getting app settings for ${subredditName}`);

    const removalReasonId = (await context.settings.get<string>("removalReasonId"))?.trim();
    const removalComment = (await context.settings.get<string>("removalComment"))?.trim();

    // These should never be undefined, but default to the safer option of true if they somehow are.
    const ignoreModerators = await context.settings.get<boolean>("ignoreModerators") ?? true;
    const ignoreContributors = await context.settings.get<boolean>("ignoreContributors") ?? true;

    // ignoreAutoRemoved is effectively true if ignoreRemoved is true, so we'll need to check both.
    const ignoreAutoRemoved = (await context.settings.get<boolean>("ignoreAutoRemoved") ?? true) || (await context.settings.get<boolean>("ignoreRemoved") ?? false);

    let removalFlair: SetFlairOptions | undefined = {
        subredditName,
        text: (await context.settings.get<string>("removalFlairText"))?.trim(),
        cssClass: (await context.settings.get<string>("removalFlairCssClass"))?.trim(),
        flairTemplateId: (await context.settings.get<string>("removalFlairTemplateId"))?.trim(),
    };
    // No removal flair if all fields are undefined or empty. Also trim whitespace from the fields to account for accidentally enter whitespaces.
    if (!removalFlair.text && !removalFlair.cssClass && !removalFlair.flairTemplateId) {
        removalFlair = undefined;
    }

    // The booleans should never be undefined and the numbers should be validated in the settings page, but we'll check to make TS happy.
    const quotaAmount = await context.settings.get<number>("quotaAmount");
    const quotaPeriod = await context.settings.get<number>("quotaPeriod");
    if (!quotaAmount || !quotaPeriod) {
        throw new Error(`Missing either quotaAmount (${quotaAmount ?? ""}) or quotaPeriod (${quotaPeriod ?? ""}) in onPostCreate`);
    }

    // Custom dateformat shouldn't ever be invalid because it's validated in the settings page, but we'll check anyway.
    const customDateformat = {
        dateformat: await context.settings.get<string>("customTimeformat") ?? "yyyy-MM-dd hh-mm-ss",
        timezone: await context.settings.get<string>("customTimezone") ?? "UTC",
        locale: getLocaleFromString(await context.settings.get<string>("customLocale") ?? "") ?? enUS,
    };
    if (!isCustomDateformat(customDateformat)) {
        throw new Error(`One of the custom dateformat settings is invalid or missing: ${JSON.stringify(customDateformat)}`);
    }

    console.log(`got app settings for ${subredditName}`);
    // #endregion

    // Ignore moderators and contributors.
    if (ignoreModerators && await isModerator(context.reddit, subredditName, authorName)) {
        console.log(`skipping moderator ${authorName}`);
        return;
    }
    if (ignoreContributors && await isContributor(context.reddit, subredditName, authorName)) {
        console.log(`skipping contributor ${authorName}`);
        return;
    }

    // Check if the post has already been actioned.
    const hasRemoveActioned = await hasPerformedActions(context.reddit, subredditName, postId, ["removelink", "spamlink"]);
    const post = await context.reddit.getPostById(postId);
    if (hasRemoveActioned || post.isRemoved()) {
        console.log(`skipping removed post ${postId} (hasRemoveActioned: ${hasRemoveActioned.toString()}, isRemoved: ${post.isRemoved().toString()})`);
        return;
    }

    // Clear old posts by the author and get the posts by the author in the quota period at the same time.
    const postsByAuthor = await clearOldPostsByAuthor(context.kvStore, authorId, quotaPeriod);

    // Don't count the current post towards the quota.
    if (postId in postsByAuthor) {
        Reflect.deleteProperty(postsByAuthor, postId);
    }
    console.log(`postsByAuthor ${authorId}: ${JSON.stringify(postsByAuthor)}`);

    const numPostsByAuthor = Object.keys(postsByAuthor).length;
    // Check if the author has exceeded their quota.
    if (numPostsByAuthor >= quotaAmount) {
        // Do the removal first, then do removal reason stuff.
        console.log(`removing post ${postId} for user ${authorId}; ${numPostsByAuthor} already posted, another would exceed ${quotaAmount}`);
        await context.reddit.remove(postId, false).catch(e => console.error(`Post removal failed for ${postId}`, e));

        let placeholders: Placeholder[] = [];
        let extraPlaceholders: Record<string, string> = {};

        // Only populate placeholders and extraPlaceholders if there is a removal comment or removal flair.
        if (removalComment || removalFlair) {
            placeholders = await getRecommendedPlaceholdersFromPost(post, customDateformat);
            extraPlaceholders = {
                "{{author_flair_template_id}}": event.post?.authorFlair?.text ?? "",
                "{{quota_amount}}": quotaAmount.toString(),
                "{{quota_period}}": quotaPeriod.toString(),
                "{{quota_next_unix}}": "",
                "{{quota_next_iso}}": "",
                "{{quota_next_custom}}": "",
                "{{mod}}": (await context.reddit.getAppUser()).username,
            };

            // Calculate when the quota will have another slot open. That is the oldest post + quota period.
            let quotaOldestPost = Date.now();
            if (numPostsByAuthor === quotaAmount && ignoreAutoRemoved) {
                // If the stored posts is equal to the maximum, the oldest post will free up a slot.
                quotaOldestPost = Math.min(Date.now(), ...Object.values(postsByAuthor));
            } else if (numPostsByAuthor >= quotaAmount) {
                /* The oldest post will only free up a slot if we're ignoring auto-removed posts and the number of stored posts is equal to the maximum.
                 * We'll need to find the oldest post that will free up a slot.
                 * That should be the post at the nth from the end in a sorted list (where n is the quota amount).
                 */
                const sortedPosts = Object.values(postsByAuthor).sort((a, b) => a - b);

                /* If we're not ignoring auto-removed posts, that means the current post will also count towards the quota.
                 * The current post was removed from postsByAuthor earlier, so we'd need to find the nth+1 from the end instead.
                 * We can do that by casting !ignoreAutoRemoved to a number, which will be 0 if true and 1 if false.
                 *
                 * Couple of examples:
                 *
                 * quotaAmount = 3, ignoreAutoRemoved = true, sortedPosts.length = 5
                 * Here we'd want the 3rd post from the end, meaning the one at index 5-3+0=2
                 *
                 * quotaAmount = 3, ignoreAutoRemoved = false, sortedPosts.length = 5
                 * Here we'd want the 3rd post from the end, but the end is missing the current post,
                 * so it works out to the 2nd post from the end at index 5-3+1=3
                 *
                 * quotaAmount = 2, ignoreAutoRemoved = false, sortedPosts.length = 2
                 * Here we'd normally want the oldest post, but since we're not ignoring auto-removed posts,
                 * we'll need to count the current one and actually want the 2nd oldest post, so index 2-2+1=1.
                 */
                quotaOldestPost = sortedPosts[sortedPosts.length - quotaAmount + Number(!ignoreAutoRemoved)];
            }

            // Check that we didn't somehow get an invalid timestamp. We can repurpose the validatePositiveNumber function for this.
            if (typeof await validatePositiveNumber({value: quotaOldestPost, isEditing: false}) === "undefined") {
                // quotaNext is the date when the quota will have another slot open, which is the oldest post + quota period.
                const quotaNext = new Date(quotaOldestPost + quotaPeriod * 60 * 60 * 1000);
                if (isValidDate(quotaNext)) {
                    console.log(`quotaOldestPost for ${authorId} ${quotaOldestPost} and quotaNext ${quotaNext.getTime()}`);
                    extraPlaceholders["{{quota_next_unix}}"] = Math.floor(quotaNext.getTime() / 1000).toString();
                    extraPlaceholders["{{quota_next_iso}}"] = quotaNext.toISOString();
                    extraPlaceholders["{{quota_next_custom}}"] = safeFormatInTimeZone(quotaNext, customDateformat);
                }
            } else {
                console.error(`Invalid quotaOldestPost (${quotaOldestPost}) in onPostCreate`);
            }
        }

        if (removalReasonId) {
            console.log(`submitting removal reason ${removalReasonId} for post ${postId}`);
            await context.reddit.addRemovalNote({itemIds: [postId], reasonId: removalReasonId, modNote: "Quota Exceeded"})
                .catch(e => console.error(`Removal reason submission failed for ${postId}`, e));
        }

        if (removalComment) {
            console.log(`submitting removal comment for post ${postId}`);
            const removalCommentText = assembleRemovalReason(
                {body: removalComment},
                placeholders,
                extraPlaceholders
            );
            await submitPostReply(context.reddit, postId, removalCommentText, true, true)
                .catch(e => console.error(`Removal comment submission failed for ${postId}`, e));
        }

        if (removalFlair) {
            console.log(`setting removal flair for post ${postId}`);
            let removalFlairText = removalFlair.text;
            if (removalFlairText) {
                removalFlairText = assembleRemovalReason(
                    {body: removalFlairText},
                    placeholders,
                    extraPlaceholders
                );
            }
            await context.reddit.setPostFlair({
                postId,
                subredditName,
                text: removalFlairText ? removalFlairText : undefined,
                cssClass: removalFlair.cssClass ? removalFlair.cssClass : undefined,
                flairTemplateId: removalFlair.flairTemplateId ? removalFlair.flairTemplateId : undefined,
            });
        }
    } else {
        console.log(`User has not exceeded quota, ${numPostsByAuthor} posts out of ${quotaAmount} in ${quotaPeriod} hours`);
    }

    // Ignore posts that have already been actioned.
    // Oftentimes the post has been actioned, but isRemoved has not yet updated.
}

export async function onPostSubmit (event: OnTriggerEvent<PostSubmit>, context: TriggerContext) {
    console.log(`running onPostSubmit for ${event.post?.id ?? ""}`);

    const authorId = event.author?.id;
    const postId = event.post?.id;
    const createdAt = event.post?.createdAt;
    if (!authorId || !postId || !createdAt) {
        throw new Error(`Missing authorId (${authorId ?? ""}), postId (${postId ?? ""}), or createdAt (${createdAt ?? ""}) in onPostSubmit`);
    }

    // Log the post to the kvStore no matter what, we can filter it out in onPostCreate based on the settings.
    await addPostToKvStore(context.kvStore, authorId, postId, createdAt).catch(e => console.error("addPostToKvStore failed in onPostSubmit", e));
}

export async function onPostDelete (event: OnTriggerEvent<PostDelete>, context: TriggerContext) {
    console.log(`running onPostDelete for ${event.author?.id ?? ""}`);
    const ignoreDeleted = await context.settings.get<boolean>("ignoreDeleted");
    if (!ignoreDeleted) {
        return;
    }

    // We can't do anything if the author is missing.
    const authorId = event.author?.id;
    if (!authorId) {
        throw new Error("Missing authorId in onPostDelete");
    }

    // There's no need to check the post if it's not in the kvStore.
    const postsByAuthor = await getPostsByAuthor(context.kvStore, authorId);
    if (!(event.postId in postsByAuthor)) {
        console.log(`Post ${event.postId} does not exist in kvStore for user ${authorId} in onPostDelete`);
        return;
    }

    // Fetch the post. We don't want to remove the post if it was removed before it was deleted.
    // If ignoreRemoved or ignoreAutoRemoved were true, it would've already been removed from the kvStore.
    const post = await context.reddit.getPostById(event.postId);
    if (post.isRemoved() || post.isSpam()) {
        console.log(`${event.postId} was deleted after being removed, not removing from kvStore in onPostDelete`);
        return;
    }

    console.log(`Removing post ${event.postId} from kvStore in onPostDelete`);
    await removePostFromKvStore(context.kvStore, authorId, event.postId).catch(e => console.error("removePostFromKvStore failed in onPostDelete", e));
}

export async function onPostRemove (event: OnTriggerEvent<ModAction>, context: TriggerContext) {
    console.log(`running onPostRemove for ${event.targetPost?.id ?? ""}`);
    if (event.action !== "removelink" && event.action !== "spamlink") {
        throw new Error(`Invalid action ${event.action ?? ""} in onPostRemove`);
    }

    const postId = event.targetPost?.id;
    const authorId = event.targetPost?.authorId;
    const createdAt = event.targetPost?.createdAt;
    const actionedAt = event.actionedAt;
    if (!postId || !authorId || !createdAt || !actionedAt) {
        throw new Error(`Missing data in onPostRemove (postId: ${postId ?? ""}, authorId: ${authorId ?? ""}, createdAt: ${createdAt ?? ""}, actionedAt: ${actionedAt?.getTime() ?? ""})`);
    }

    const postsByAuthor = await getPostsByAuthor(context.kvStore, authorId);
    if (!(postId in postsByAuthor)) {
        console.log(`Post ${postId} does not exist in kvStore for user ${authorId} in onPostRemove`);
        return;
    }

    const ignoreRemoved = await context.settings.get<boolean>("ignoreRemoved");
    if (ignoreRemoved) {
        console.log(`Removing post ${postId} from kvStore in onPostRemove for ignoreRemoved`);
        await removePostFromKvStore(context.kvStore, authorId, postId).catch(e => console.error("removePostFromKvStore failed in onPostRemove", e));
        return;
    }

    const ignoreAutoRemoved = await context.settings.get<boolean>("ignoreAutoRemoved");
    if (ignoreAutoRemoved) {
        // If the post was removed within 60 seconds of being created, it was probably removed by AutoModerator or another bot.
        if (getTimeDeltaInSeconds(new Date(createdAt), actionedAt) <= 60) {
            console.log(`Removing post ${postId} from kvStore in onPostRemove for ignoreAutoRemoved`);
            await removePostFromKvStore(context.kvStore, authorId, postId).catch(e => console.error("removePostFromKvStore failed in onPostRemove", e));
            return;
        }
    }
}

export async function onPostApprove (event: OnTriggerEvent<ModAction>, context: TriggerContext) {
    console.log(`running onPostApprove for ${event.targetPost?.id ?? ""}`);
    if (event.action !== "approvelink") {
        throw new Error(`Invalid action ${event.action ?? ""} in onPostApprove`);
    }

    const postId = event.targetPost?.id;
    const createdAt = event.targetPost?.createdAt;
    const authorId = event.targetPost?.authorId;
    if (!createdAt || !postId || !authorId) {
        throw new Error(`Missing data in onPostApprove (createdAt: ${createdAt ?? ""}, postId: ${postId ?? ""}, authorId: ${authorId ?? ""})`);
    }

    const quotaPeriod = await context.settings.get<number>("quotaPeriod");
    if (!quotaPeriod) {
        throw new Error(`Missing quotaPeriod (${quotaPeriod ?? ""}) in onPostApprove`);
    }

    const maxAge = Date.now() - quotaPeriod * 60 * 60 * 1000;
    if (createdAt < maxAge) {
        console.log(`Post ${postId} is too old to be tracked, not readding to kvStore`);
        return;
    }

    const postsByAuthor = await getPostsByAuthor(context.kvStore, authorId);
    if (postId in postsByAuthor) {
        console.log(`Post ${postId} already exists in kvStore for user ${authorId}`);
        return;
    }

    console.log(`Readding post ${postId} to kvStore in onPostApprove`);
    await addPostToKvStore(context.kvStore, authorId, postId, createdAt).catch(e => console.error("addPostToKvStore failed in onPostApprove", e));
}

export async function onModAction (event: OnTriggerEvent<ModAction>, context: TriggerContext) {
    if (event.action === "removelink" || event.action === "spamlink") {
        await onPostRemove(event, context);
    } else if (event.action === "approvelink") {
        await onPostApprove(event, context);
    }
}

export async function onAppChanged (_: OnTriggerEvent<AppInstall | AppUpgrade>, context: TriggerContext) {
    try {
        await startSingletonJob(context.scheduler, "clearOldPosts", "*/5 * * * *");
    } catch (e) {
        console.error("Failed to schedule clearOldPosts job on AppInstall", e);
        throw e;
    }
}

