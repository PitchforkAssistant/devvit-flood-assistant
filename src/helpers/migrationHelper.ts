import {RedisClient, TriggerContext} from "@devvit/public-api";
import {KEYS, LATEST_VERSION} from "../constants.js";

export async function getInstalledVersion (redis: RedisClient): Promise<number> {
    try {
        const installedVersion = await redis.get(KEYS.INSTALL_VERSION);

        // If no version key is found, we assume its a fresh install and set the version to the latest.
        // The only exception is if the install predates the versioning system,
        // but that data uses kvStore and can't be migrated anyway.
        if (!installedVersion) {
            await redis.set(KEYS.INSTALL_VERSION, LATEST_VERSION.toString());
            return LATEST_VERSION;
        }

        return parseInt(installedVersion);
    } catch (e) {
        console.error("Failed to get installed version", e);
        throw e;
    }
}

export async function migrate ({redis}: TriggerContext): Promise<void> {
    const installedVersion = await getInstalledVersion(redis);

    if (installedVersion === LATEST_VERSION) {
        console.log(`Already at version ${LATEST_VERSION}`);
        return;
    }
    console.log(`Migrating data from version ${installedVersion} to ${LATEST_VERSION}`);

    // We initionally want to allow fallthroughs to allow for future migrations to be added on top of the current one
    /* eslint-disable no-fallthrough */
    switch (installedVersion) {
        case 0:
            // Future migration from version 0 to 1
        case 1:
            // Future migrations to 1 and above can be added as needed
            break;
        default:
            throw new Error(`Unknown installed version: ${installedVersion}`);
    }
    /* eslint-enable no-fallthrough */

    // Update installed version
    await redis.set(KEYS.INSTALL_VERSION, LATEST_VERSION.toString());
    console.log(`Migration to version ${LATEST_VERSION} complete`);
}
