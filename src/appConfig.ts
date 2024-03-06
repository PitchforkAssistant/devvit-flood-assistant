import {SetFlairOptions, SettingsClient} from "@devvit/public-api";
import {CustomDateformat, getLocaleFromString, isCustomDateformat} from "devvit-helpers";
import {DEFAULTS, KEYS} from "./constants.js";
import {enUS} from "date-fns/locale";

export class FloodAssistantConfigError extends Error {
    constructor (key: string, value: unknown) {
        super(`Error parsing ${key} in FloodAssistantConfig, got unexpected value: ${String(value)}`);
        this.name = "FloodAssistantConfigError";
    }
}

export type FloodAssistantConfig = {
    quotaAmount: number;
    quotaPeriod: number;

    ignoreModerators: boolean;
    ignoreContributors: boolean;
    ignoreAutoRemoved: boolean;
    ignoreRemoved: boolean;
    ignoreDeleted: boolean;

    removalReasonId?: string;
    removalComment?: string;
    removalFlair?: Omit<SetFlairOptions, "subredditName" | "textColor" | "backgroundColor">;
    customDateformat: CustomDateformat;
}

/**
 * Get the FloodAssistantConfig object from the settings client as slowly as possible, each setting key is fetched individually.
 * @param settings The settings client to use.
 * @throws FloodAssistantConfigError if any setting is missing or invalid.
 * @returns The FloodAssistantConfig object.
 */
export async function getFloodAssistantConfigSlow (settings: SettingsClient): Promise<FloodAssistantConfig> {
    /*
    * We are intentionally getting each setting individually instead of using settings.getAll().
    * That is because we want to intentionally delay the execution of the rest of the function.
    * The purpose of the delay is to let AutoModerator and possibly other bots
    * do their thing before we do ours, so that we don't remove posts that would have been removed anyway.
    *
    * This is a sneaky little trick because awaits on Devvit things do not count towards the execution time limit.
    * Meaning that we can effectively delay the execution of the rest of the function by a little.
    *
    * Also I'm aware that onPostCreate (where this will be used) is already triggered some seconds after onPostSubmit,
    * but it only gurantees that certain safety checks by Reddit have been completed, but not necessarily AutoModerator.
    */

    const quotaAmount = await settings.get<number>(KEYS.QUOTA_AMOUNT);
    if (!quotaAmount || typeof quotaAmount !== "number" || quotaAmount < 1 || !Number.isInteger(quotaAmount)) {
        throw new FloodAssistantConfigError(KEYS.QUOTA_AMOUNT, quotaAmount);
    }

    const quotaPeriod = await settings.get<number>(KEYS.QUOTA_PERIOD);
    if (!quotaPeriod || typeof quotaPeriod !== "number" || quotaPeriod <= 0 || quotaPeriod > DEFAULTS.MAX_QUOTA_PERIOD) {
        throw new FloodAssistantConfigError(KEYS.QUOTA_PERIOD, quotaPeriod);
    }

    const booleanKeys = [KEYS.IGNORE_MODS, KEYS.IGNORE_MEMBERS, KEYS.IGNORE_AUTO_REMOVED, KEYS.IGNORE_REMOVED, KEYS.IGNORE_DELETED];
    const booleanSettings: Record<string, boolean> = {};
    for (const key of booleanKeys) {
        const value = await settings.get<boolean>(key);
        if (typeof value !== "boolean") {
            throw new FloodAssistantConfigError(key, value);
        }
        booleanSettings[key] = value;
    }

    const removalReasonId = await settings.get<string>(KEYS.REMOVAL_REASON_ID);
    const removalComment = await settings.get<string>(KEYS.REMOVAL_COMMENT);

    const removalFlairText = await settings.get<string>(KEYS.REMOVAL_FLAIR_TEXT);
    const removalFlairCss = await settings.get<string>(KEYS.REMOVAL_FLAIR_CSS);
    const removalFlairId = await settings.get<string>(KEYS.REMOVAL_FLAIR_ID);
    let removalFlair: Omit<SetFlairOptions, "subredditName"> | undefined;
    if (removalFlairText || removalFlairCss || removalFlairId) {
        removalFlair = {
            text: removalFlairText,
            cssClass: removalFlairCss,
            flairTemplateId: removalFlairId,
        };
    }

    const customDateformat = {
        dateformat: await settings.get<string>(KEYS.CUSTOM_DATE_TEMPLATE) ?? "yyyy-MM-dd hh-mm-ss",
        timezone: await settings.get<string>(KEYS.CUSTOM_TIMEZONE) ?? "UTC",
        locale: getLocaleFromString(await settings.get<string>(KEYS.CUSTOM_LOCALE) ?? "") ?? enUS,
    };
    if (!isCustomDateformat(customDateformat)) {
        throw new FloodAssistantConfigError("customDateformat", customDateformat);
    }

    return {
        quotaAmount,
        quotaPeriod,
        ignoreModerators: booleanSettings[KEYS.IGNORE_MODS],
        ignoreContributors: booleanSettings[KEYS.IGNORE_MEMBERS],
        ignoreAutoRemoved: booleanSettings[KEYS.IGNORE_AUTO_REMOVED],
        ignoreRemoved: booleanSettings[KEYS.IGNORE_REMOVED],
        ignoreDeleted: booleanSettings[KEYS.IGNORE_DELETED],
        removalReasonId,
        removalComment,
        removalFlair,
        customDateformat,
    };
}
