import {ScheduledJobEvent, TriggerContext} from "@devvit/public-api";
import {runCleanup} from "../core/cleanup.js";

export async function onRunClearOldPosts (event: ScheduledJobEvent<undefined>, {redis, settings}: TriggerContext) {
    console.log("running onRunClearOldPosts", event);

    try {
        await runCleanup({redis, settings});
    } catch (e) {
        console.error("Failed to run cleanup in onRunClearOldPosts", e);
        throw e;
    }

    console.log("onRunClearOldPosts complete");
}
