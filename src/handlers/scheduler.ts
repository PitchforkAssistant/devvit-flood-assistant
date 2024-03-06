import {ScheduledJobEvent, TriggerContext} from "@devvit/public-api";
import {toNumberOrDefault} from "devvit-helpers";
import {clearOldPostsByAuthor, clearOldActionTimes} from "../helpers/redisHelpers.js";

export async function onRunClearOldPosts (event: ScheduledJobEvent, context: TriggerContext) {
    console.log("running onRunClearOldPosts");

    // Clear posts older than the quota period from Redis.
    // Default to the maximum of a month if the quota period is invalid (sometimes happens when the app is installed without hitting save on the settings page).
    const quotaPeriod = toNumberOrDefault(await context.settings.get<number>("quotaPeriod"), 744);
    const oldestAllowed = new Date(Date.now() - quotaPeriod * 60 * 60 * 1000);
    console.log(`oldestAllowed: ${oldestAllowed.toISOString()}`);

    console.log("getting stored authors");
    const redisAuthors = await context.redis.hkeys("authors");

    console.log("clearOldPostsByAuthor");
    redisAuthors.forEach(key => void clearOldPostsByAuthor(context.redis, key, oldestAllowed)
        .catch(e => console.error(`clearOldPostsByAuthor ${key} failed in onRunClearOldPosts`, e)));

    console.log("clearOldActionTimes");
    await clearOldActionTimes(context.redis, oldestAllowed);

    console.log("onRunClearOldPosts complete");
}
