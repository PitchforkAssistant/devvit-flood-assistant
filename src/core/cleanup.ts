import {toNumberOrDefault} from "devvit-helpers";
import {purgeOldTrackedActions} from "./redis/trackedActions.js";
import {purgeOldTrackedPosts} from "./redis/trackedPosts.js";
import {NeedsRedis, NeedsSettings} from "./types/needs.js";
import {hoursToMillis} from "./utils/time.js";

export type RunCleanupOptions = NeedsRedis & NeedsSettings;

export async function runCleanup ({redis, settings}: RunCleanupOptions) {
    // Clear posts older than the quota period from Redis.
    // Default to the maximum of a month if the quota period is invalid (sometimes happens when the app is installed without hitting save on the settings page).
    const quotaPeriod = toNumberOrDefault(await settings.get<number>("quotaPeriod"), 744);
    const oldestAllowed = new Date(Date.now() - hoursToMillis(quotaPeriod));
    console.log(`runCleanup - oldestAllowed: ${oldestAllowed.toISOString()}`);

    await Promise.all([
        purgeOldTrackedPosts({redis, oldestAllowed}),
        purgeOldTrackedActions({redis, oldestAllowed}),
    ]);
}
