import {ModAction} from "@devvit/protos";
import {TriggerContext} from "@devvit/public-api";
import {addTrackedActionTime, remTrackedActionTime} from "../core/redis/trackedActions.js";
import {DEFAULTS, KEYS} from "../constants.js";

export async function onModAction (event: ModAction, {redis, settings}: TriggerContext) {
    // We're only interested in link removals
    if (event.action !== "removelink" && event.action !== "spamlink" && event.action !== "approvelink") {
        return;
    }
    console.log(`processing ${event.action} for ${event.targetPost?.id} by ${event.targetPost?.authorId}`);

    const postId = event.targetPost?.id;
    const actionedAt = event.actionedAt;

    const createdAt = event.targetPost?.createdAt; // TODO: Less stringent with created at?
    if (!postId || !actionedAt || !createdAt) {
        console.error(`Missing postId (${postId}), actionedAt (${actionedAt?.getTime()}), or createdAt (${createdAt}) in onModAction`);
        return;
    }

    const quotaPeriod = await settings.get<number>(KEYS.QUOTA_PERIOD) ?? DEFAULTS.MAX_QUOTA_PERIOD;

    if (actionedAt.getTime() - createdAt > quotaPeriod * 1000 * 60 * 60) { // TODO: hours to millis helper func instead of repeating this calculation everywhere
        console.log(`Ignoring ${event.action} for ${postId} as it's too old`);
        return;
    }

    // TODO: Move is logic to a file in ./core
    console.log(`tracking ${event.action} for ${postId}`);
    // TODO: Check existing action times first? What if the triggers aren't in order
    if (event.action === "approvelink") {
        await remTrackedActionTime({redis, action: "remove", postId});
    } else {
        await addTrackedActionTime({redis, action: "remove", postId, actionedAt});
    }
}
