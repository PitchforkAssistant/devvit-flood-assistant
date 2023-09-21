import {ScheduledJobEvent, TriggerContext} from "@devvit/public-api";
import {toNumberOrDefault} from "devvit-helpers";
import {clearOldPostsByAuthor} from "../helpers/kvStoreHelpers.js";

export async function onRunClearOldPosts (event: ScheduledJobEvent, context: TriggerContext) {
    console.log("running onRunClearOldPosts");

    // Clear posts older than the quota period from the kv store.
    // Default to the maximum of a week if the quota period is invalid (sometimes happens when the app is installed without hitting save on the settings page).
    const quotaPeriod = toNumberOrDefault(await context.settings.get<number>("quotaPeriod"), 168);

    const kvStoreKeys = await context.kvStore.list().catch(e => {
        console.error("context.kvStore.list failed in onRunClearOldPosts", e); return [];
    });
    kvStoreKeys.forEach(key => void clearOldPostsByAuthor(context.kvStore, key, quotaPeriod)
        .catch(e => console.error(`clearOldPostsByAuthor ${key} failed in onRunClearOldPosts`, e)));
}
