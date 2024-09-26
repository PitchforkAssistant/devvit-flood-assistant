import {PostCreate} from "@devvit/protos";
import {SetPostFlairOptions, TriggerContext} from "@devvit/public-api";
import {getFloodAssistantConfigSlow} from "../appConfig.js";
import {FloodingEvaluator} from "../evaluators.js";
import {assembleRemovalReason, getRecommendedPlaceholdersFromPost, safeFormatInTimeZone, submitPostReply} from "devvit-helpers";

export async function onPostCreate (event: PostCreate, context: TriggerContext) {
    console.log("running onPostCreate");

    const postId = event.post?.id;
    const authorId = event.author?.id;
    if (!authorId || !postId) {
        throw new Error(`Missing authorId (${authorId}) or postId (${postId}) in onPostCreate`);
    }

    const config = await getFloodAssistantConfigSlow(context.settings);
    const subreddit = await context.reddit.getCurrentSubreddit();
    const author = await context.reddit.getUserById(authorId);
    const post = await context.reddit.getPostById(postId);

    console.log("Creating FloodingEvaluator");
    const evaluator = new FloodingEvaluator(config, context.reddit, context.redis, subreddit, author, post);

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
    const refetchedPost = await context.reddit.getPostById(postId);
    if (refetchedPost.isRemoved() || refetchedPost.isSpam() || refetchedPost.removedByCategory && refetchedPost.removedByCategory !== "automod_filtered") {
        console.log(`Post ${postId} by ${author.username} has already been been removed by something else, skipping removal`);
        return;
    }

    await post.remove().catch(e => console.error(`Failed to remove ${postId}`, e));

    if (config.removalReasonId) {
        await post.addRemovalNote({reasonId: config.removalReasonId, modNote: "Quota Exceeded"})
            .catch(e => console.error(`Failed to add removal note to ${postId}`, e));
    }

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
        "{{mod}}": (await context.reddit.getAppUser()).username,
    };

    if (config.removalComment) {
        const commentText = assembleRemovalReason({body: config.removalComment}, placeholders, extraPlaceholders);
        await submitPostReply(context.reddit, post.id, commentText, true, true).catch(e => console.error(`Failed to add removal comment to ${postId}`, e));
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
        await context.reddit.setPostFlair(flairOptions).catch(e => console.error(`Failed to set ${postId} removal flair`, e));
    }

    if (config.removalLock) {
        await post.lock().catch(e => console.error(`Failed to lock ${postId}`, e));
    }
}
