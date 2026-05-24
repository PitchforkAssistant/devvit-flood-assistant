import {isValidDate} from "devvit-helpers";
import {KEYS, DEFAULTS} from "../constants.js";
import {addTrackedActionTime, getTrackedActionTime, remTrackedActionTime, TrackedActionType} from "./redis/trackedActions.js";
import {NeedsRedis, NeedsSettings} from "./types/needs.js";
import {hoursToMillis} from "./utils/time.js";

export type TrackActionOptions = NeedsRedis & NeedsSettings & {
    postId: string;
    action: TrackedActionType | "approve";
    actionedAt?: Date;
    createdAt?: Date; // Only needed for approve actions, but including it here for simplicity. If not provided, will default to now, which may cause issues if the triggers aren't in order.
}

export async function trackAction ({redis, settings, postId, action, actionedAt, createdAt}: TrackActionOptions) {
    if (!actionedAt || !isValidDate(actionedAt)) {
        actionedAt = new Date();
        console.warn(`trackAction called without actionedAt for ${action} on post ${postId}, defaulting to now (${actionedAt.toISOString()})`);
    }
    if (!createdAt || !isValidDate(createdAt)) {
        createdAt = new Date();
        console.warn(`trackAction called without createdAt for ${action} on post ${postId}, defaulting to now (${createdAt.toISOString()})`);
    }

    console.log(`processing ${action} for ${postId} (actionedAt: ${actionedAt.toISOString()}, createdAt: ${createdAt.toISOString()})`);
    const quotaPeriod = await settings.get<number>(KEYS.QUOTA_PERIOD) ?? DEFAULTS.MAX_QUOTA_PERIOD;
    if (actionedAt.getTime() - createdAt.getTime() > hoursToMillis(quotaPeriod)) {
        console.log(`Ignoring ${action} for ${postId} as it's too old (actionedAt: ${actionedAt.toISOString()}, createdAt: ${createdAt.toISOString()})`);
        return;
    }

    if (action === "delete") {
        console.log(`Adding tracked ${action} action for ${postId} to Redis with time ${actionedAt.toISOString()}`);
        await addTrackedActionTime({redis, action, postId, actionedAt});
    } else {
        console.log(`Checking whether a tracked remove action exists for ${postId} in Redis`);
        const existingRemoveTime = await getTrackedActionTime({redis, action: "remove", postId});

        if (action === "approve") {
            if (existingRemoveTime) {
                if (existingRemoveTime > actionedAt) {
                    console.log(`Received approve action for ${postId}, but existing remove action is newer (removeTime: ${new Date(existingRemoveTime).toISOString()}, actionedAt: ${actionedAt.toISOString()}), skipping.`);
                    return;
                }
            } else {
                console.warn(`Received approve action for ${postId} but no corresponding remove action found`);
            }
            console.log(`Removing tracked remove action for ${postId} from Redis`);
            await remTrackedActionTime({redis, action: "remove", postId});
        } else {
            if (existingRemoveTime) {
                if (existingRemoveTime < actionedAt) {
                    console.log(`Received ${action} action for ${postId}, but existing remove action is older (removeTime: ${new Date(existingRemoveTime).toISOString()}, actionedAt: ${actionedAt.toISOString()}), skipping.`);
                    return;
                }
                console.log(`Received ${action} action for ${postId}, but existing remove action is newer?? (removeTime: ${new Date(existingRemoveTime).toISOString()}, actionedAt: ${actionedAt.toISOString()})`);
            }
            console.log(`Adding tracked ${action} action for ${postId} to Redis with time ${actionedAt.toISOString()}`);
            await addTrackedActionTime({redis, action, postId, actionedAt});
        }
    }
}
