import {PostCreate, PostSubmit, AppInstall, AppUpgrade, PostDelete, ModAction} from "@devvit/protos";
import {TriggerContext, OnTriggerEvent, SetFlairOptions} from "@devvit/public-api";
import {addPostToKvStore, clearOldPostsByAuthor, getPostsByAuthor, removePostFromKvStore} from "../helpers/kvStoreHelpers.js";
import {getLocaleFromString, hasPerformedActions, isContributor, isModerator, getRecommendedPlaceholdersFromPost, assembleRemovalReason, submitPostReply, startSingletonJob, isCustomDateformat, getTimeDeltaInSeconds} from "devvit-helpers";
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

    const removalReasonId = await context.settings.get<string>("removalReasonId");
    const removalComment = await context.settings.get<string>("removalComment");

    // These should never be undefined, but default to the safer option of true if they somehow are.
    const ignoreModerators = await context.settings.get<boolean>("ignoreModerators") ?? true;
    const ignoreContributors = await context.settings.get<boolean>("ignoreContributors") ?? true;

    let removalFlair: SetFlairOptions | undefined = {
        subredditName,
        text: await context.settings.get<string>("removalFlairText"),
        cssClass: await context.settings.get<string>("removalFlairCssClass"),
        flairTemplateId: await context.settings.get<string>("removalFlairTemplateId"),
    };
    // No removal flair if all fields are undefined or empty. Also trim whitespace from the fields to account for accidentally enter whitespaces.
    if (!removalFlair.text?.trim() && !removalFlair.cssClass?.trim() && !removalFlair.flairTemplateId?.trim()) {
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
    console.log(`postsByAuthor ${authorId}: ${JSON.stringify(postsByAuthor)}`);

    // Don't count the current post towards the quota.
    if (postId in postsByAuthor) {
        Reflect.deleteProperty(postsByAuthor, postId);
    }

    // Check if the author has exceeded their quota.
    if (Object.keys(postsByAuthor).length >= quotaAmount) {
        // Do the removal first, then do removal reason stuff.
        console.log(`removing post ${postId} for user ${authorId} due to quota`);
        await context.reddit.remove(postId, false).catch(e => console.error(`Post removal failed for ${postId}`, e));

        const placeholders = removalComment?.trim() || removalFlair ? await getRecommendedPlaceholdersFromPost(post, customDateformat) : [];

        if (removalReasonId?.trim()) {
            console.log(`submitting removal reason ${removalReasonId} for post ${postId}`);
            await context.reddit.addRemovalNote({itemIds: [postId], reasonId: removalReasonId, modNote: "Quote Exceeded"})
                .catch(e => console.error(`Removal reason submission failed for ${postId}`, e));
        } else if (removalComment?.trim()) {
            console.log(`submitting removal comment for post ${postId}`);
            const removalCommentText = assembleRemovalReason(
                {body: removalComment},
                placeholders,
                {
                    "{{author_flair_text}}": event.post?.authorFlair?.text ?? "",
                    "{{author_flair_css_class}}": event.post?.authorFlair?.text ?? "",
                    "{{author_flair_template_id}}": event.post?.authorFlair?.text ?? "",
                    "{{quota_amount}}": quotaAmount.toString(),
                    "{{quota_period}}": quotaPeriod.toString(),
                }
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
                    {
                        "{{author_flair_text}}": event.post?.authorFlair?.text ?? "",
                        "{{author_flair_css_class}}": event.post?.authorFlair?.text ?? "",
                        "{{author_flair_template_id}}": event.post?.authorFlair?.text ?? "",
                        "{{quota_amount}}": quotaAmount.toString(),
                        "{{quota_period}}": quotaPeriod.toString(),
                    }
                );
            }
            await context.reddit.setPostFlair({
                postId,
                subredditName,
                text: removalFlairText,
                cssClass: removalFlair.cssClass,
                flairTemplateId: removalFlair.flairTemplateId,
            });
        }
    }

    // Ignore posts that have already been actioned.
    // Oftentimes the post has been actioned, but isRemoved has not yet updated.
}

export async function onPostSubmit (event: OnTriggerEvent<PostSubmit>, context: TriggerContext) {
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
        return;
    }

    // Fetch the post. We don't want to remove the post if it was removed before it was deleted.
    // If ignoreRemoved or ignoreAutoRemoved were true, it would've already been removed from the kvStore.
    const post = await context.reddit.getPostById(event.postId);
    if (post.isRemoved() || post.isSpam()) {
        return;
    }

    console.log(`Removing post ${event.postId} from kvStore in onPostDelete`);
    await removePostFromKvStore(context.kvStore, authorId, event.postId).catch(e => console.error("removePostFromKvStore failed in onPostDelete", e));
}

export async function onPostRemove (event: OnTriggerEvent<ModAction>, context: TriggerContext) {
    if (event.action !== "removelink" && event.action !== "spamlink") {
        return;
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
    if (event.action !== "approvelink") {
        return;
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

    console.log(`Redding post ${postId} to kvStore in onPostApprove`);
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

