import {PostCreate} from "@devvit/protos";
import {SetPostFlairOptions, TriggerContext} from "@devvit/public-api";
import {getFloodAssistantConfigSlow} from "../appConfig.js";
import {FloodingEvaluator} from "../core/evaluators.js";
import {assembleRemovalReason, getRecommendedPlaceholdersFromPost, safeFormatInTimeZone, submitPostReply} from "devvit-helpers";
import {addTrackedPost, isTrackedPost} from "../core/redis/trackedPosts.js";

export async function onPostCreate (event: PostCreate, {reddit, settings, redis}: TriggerContext) {
    console.log("running onPostCreate");

    const postId = event.post?.id;
    const authorId = event.author?.id;
    if (!authorId || !postId) {
        throw new Error(`Missing authorId (${authorId}) or postId (${postId}) in onPostCreate`);
    }

    // Mitigation and monitoring issues with PostSubmit, which sometimes just decides not to work.
    if (!await isTrackedPost({redis, authorId, postId})) {
        console.warn(`Post ${postId} by ${authorId} made it to onPostCreate without being tracked in Redis, did PostSubmit fail to trigger?`);

        await addTrackedPost({
            redis,
            authorId,
            postId,
            createdAt: event.post?.createdAt ? new Date(event.post.createdAt) : undefined,
        });
    }

    const config = await getFloodAssistantConfigSlow(settings);
    const subreddit = await reddit.getCurrentSubreddit();
    const author = await reddit.getUserById(authorId);
    const post = await reddit.getPostById(postId);

    if (!author) {
        console.error(`Failed to get author ${authorId} for evaluating post ${postId}`);
        return;
    }

    console.log("Creating FloodingEvaluator");
    const evaluator = new FloodingEvaluator(config, reddit, redis, subreddit, author, post);

    console.log("Checking if user should be ignored");
    if (await evaluator.isIgnoredUser()) {
        console.log(`User ${author.username} is in ignored group, skipping flood check`);
        return;
    }

    console.log("Checking if quota is exceeded");
    if (!await evaluator.exceedsQuota()) {
        console.log(`${postId} by ${author.username} does not exceed quota`);
        return;
    }
    console.log(`New post ${postId} by ${author.username} exceeds quota, removing`);

    // Double check that the post hasn't been removed while we were evaluating it.
    const refetchedPost = await reddit.getPostById(postId);
    if (refetchedPost.isRemoved() ||
           refetchedPost.isSpam() ||
           refetchedPost.removedByCategory && refetchedPost.removedByCategory !== "automod_filtered" && refetchedPost.removedByCategory !== "reddit") {
        console.log(`Post ${postId} by ${author.username} has already been been removed by something else, skipping removal`);
        return;
    }

    await post.remove().catch(e => console.error(`Failed to remove ${postId}`, e));

    // If there's no removal comment or flair, we don't need to do anything else.
    if (!config.removalComment && !config.removalFlair) {
        return;
    }

    // The comment and flair text may contain placeholders, so we need to generate them.
    const placeholders = await getRecommendedPlaceholdersFromPost(post, config.customDateformat);
    // Flood assistant also has special placeholders, so we need to create those too.
    const nextPostOpportunity = await evaluator.getNextPostOpportunity();
    const oldestQuotaPost = await evaluator.getOldestIncludedPost();
    const newestQuotaPost = await evaluator.getNewestIncludedPost();
    const extraPlaceholders: Record<string, string> = {
        "{{author_flair_template_id}}": event.post?.authorFlair?.templateId ?? "",
        "{{quota_amount}}": config.quotaAmount.toString(),
        "{{quota_period}}": config.quotaPeriod.toString(),
        "{{quota_next_unix}}": (nextPostOpportunity.getTime() / 1000).toString(),
        "{{quota_next_iso}}": nextPostOpportunity.toISOString(),
        "{{quota_next_custom}}": safeFormatInTimeZone(nextPostOpportunity, config.customDateformat),
        "{{quota_oldest_id}}": (oldestQuotaPost?.id ?? "").substring(3),
        "{{quota_oldest_url}}": oldestQuotaPost?.permalink ? `https://reddit.com${oldestQuotaPost?.permalink}` : "",
        "{{quota_newest_id}}": (newestQuotaPost?.id ?? "").substring(3),
        "{{quota_newest_url}}": newestQuotaPost?.permalink ? `https://reddit.com${newestQuotaPost?.permalink}` : "",
        "{{mod}}": (await reddit.getAppUser()).username,
    };

    if (config.removalComment) {
        const commentText = assembleRemovalReason({body: config.removalComment}, placeholders, extraPlaceholders);
        await submitPostReply(reddit, post.id, commentText, true, true).catch(e => console.error(`Failed to add removal comment to ${postId}`, e));
    }

    if (config.removalFlair) {
        const flairText = config.removalFlair.text ? assembleRemovalReason({body: config.removalFlair.text}, placeholders, extraPlaceholders) : undefined;
        const flairOptions: SetPostFlairOptions = {
            postId: post.id,
            subredditName: subreddit.name,
            flairTemplateId: config.removalFlair.flairTemplateId,
            cssClass: config.removalFlair.cssClass,
            text: flairText,
        };
        await reddit.setPostFlair(flairOptions).catch(e => console.error(`Failed to set ${postId} removal flair`, e));
    }

    if (config.removalLock) {
        await post.lock().catch(e => console.error(`Failed to lock ${postId}`, e));
    }

    if (config.removalReasonId) {
        await post.addRemovalNote({reasonId: config.removalReasonId, modNote: "Quota Exceeded"})
            .catch(e => console.error(`Failed to add removal note to ${postId}`, e));
    }
}
