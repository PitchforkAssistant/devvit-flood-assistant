import {ModAction} from "@devvit/protos";
import {TriggerContext} from "@devvit/public-api";
import {trackActionTime, untrackActionTime} from "../helpers/redisHelpers.js";

export async function onModAction (event: ModAction, context: TriggerContext) {
    // We're only interested in link removals
    if (event.action !== "removelink" && event.action !== "spamlink" && event.action !== "approvelink") {
        return;
    }

    const postId = event.targetPost?.id;
    const actionedAt = event.actionedAt;
    if (!postId || !actionedAt) {
        console.error(`Missing postId (${postId}) or actionedAt (${actionedAt?.toString()}) in onModAction`);
        return;
    }

    console.log(`processing ${event.action} for ${postId}`);

    if (event.action === "approvelink") {
        await untrackActionTime(context.redis, "remove", postId);
    } else {
        await trackActionTime(context.redis, "remove", postId, actionedAt);
    }
}
