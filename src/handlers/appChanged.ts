import {TriggerEventType, TriggerContext} from "@devvit/public-api";
import {startSingletonJob} from "devvit-helpers";
import {KEYS} from "../constants.js";
import {migrate} from "../helpers/migrationHelper.js";

export async function onAppChanged (event: TriggerEventType["AppInstall" | "AppUpgrade"], context: TriggerContext) {
    console.log(`Running ${event.type} `);

    try {
        console.log(`Scheduling ${KEYS.JOB_CLEAR} job in ${event.type}`);
        await startSingletonJob(context.scheduler, KEYS.JOB_CLEAR, "*/5 * * * *");
    } catch (e) {
        console.error(`Failed to schedule ${KEYS.JOB_CLEAR} job in ${event.type}`, e);
        throw e;
    }

    try {
        console.log(`Running migration in ${event.type}`);
        await migrate(context);
    } catch (e) {
        console.error(`Failed to migrate data in ${event.type}`, e);
        throw e;
    }
}
