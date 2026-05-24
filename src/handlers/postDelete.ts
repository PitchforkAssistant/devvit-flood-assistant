import {PostDelete} from "@devvit/protos";
import {TriggerContext} from "@devvit/public-api";
import {addTrackedActionTime} from "../core/redis/trackedActions.js";
import {DEFAULTS, KEYS} from "../constants.js";
import {hoursToMillis} from "../core/utils/time.js";

export async function onPostDelete (event: PostDelete, {redis, settings}: TriggerContext) {
    // The PostDelete event name is a bit misleading,
    // it actually fires both when a post is deleted by the user and when it's removed (not deleted) by a mod or admin.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (event.source !== 1) { // EventSource.USER is 1, but it may not exist in prod
        return;
    }

    console.log(`processing user deletion of ${event.postId} by ${event.author?.id}`);
    const deletedAt = event.deletedAt;
    const createdAt = event.createdAt;
    if (!deletedAt || !createdAt) {
        console.error(`Missing deletedAt (${deletedAt?.toString()}) or createdAt (${createdAt?.toString()}) in onPostDelete for post ${event.postId} by ${event.author?.id}`);
        return;
    }

    const quotaPeriod = await settings.get<number>(KEYS.QUOTA_PERIOD) ?? DEFAULTS.MAX_QUOTA_PERIOD;
    if (deletedAt.getTime() - createdAt.getTime() > hoursToMillis(quotaPeriod)) {
        console.log(`Ignoring deletion for ${event.postId} by ${event.author?.id} as it's too old`);
        return;
    }

    console.log(`tracking deletion of ${event.postId} by ${event.author?.id}`);
    await addTrackedActionTime({redis, action: "delete", postId: event.postId, actionedAt: deletedAt});
}
