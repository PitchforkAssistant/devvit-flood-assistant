import {ModAction} from "@devvit/protos";
import {TriggerContext} from "@devvit/public-api";
import {trackActionTime, untrackActionTime} from "../helpers/redisHelpers.js";
import {DEFAULTS, KEYS} from "../constants.js";

export async function onModAction (event: ModAction, context: TriggerContext) {
    // We're only interested in link removals
    if (event.action !== "removelink" && event.action !== "spamlink" && event.action !== "approvelink") {
        return;
    }
    console.log(`processing ${event.action} for ${event.targetPost?.id}`);

    const postId = event.targetPost?.id;
    const actionedAt = event.actionedAt;
    const createdAt = event.targetPost?.createdAt;
    if (!postId || !actionedAt || !createdAt) {
        console.error(`Missing postId (${postId}), actionedAt (${actionedAt?.getTime()}), or createdAt (${createdAt}) in onModAction`);
        return;
    }

    const quotaPeriod = await context.settings.get<number>(KEYS.QUOTA_PERIOD) ?? DEFAULTS.MAX_QUOTA_PERIOD;
    if (actionedAt.getTime() - createdAt > quotaPeriod * 1000 * 60 * 60) {
        console.log(`Ignoring ${event.action} for ${postId} as it's too old`);
        return;
    }

    console.log(`tracking ${event.action} for ${postId}`);
    if (event.action === "approvelink") {
        await untrackActionTime(context.redis, "remove", postId);
    } else {
        await trackActionTime(context.redis, "remove", postId, actionedAt);
    }
}
