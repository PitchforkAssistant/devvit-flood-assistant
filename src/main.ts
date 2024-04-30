import {Devvit} from "@devvit/public-api";
import {LABELS, HELP_TEXT, DEFAULTS, ERRORS} from "./constants.js";
import {LOCALE_OPTIONS, validateCustomDateformat, validateCustomLocale, validateCustomTimezone, validatePositiveInteger, validatePositiveNumber} from "devvit-helpers";
import {onAppChanged} from "./handlers/appChanged.js";
import {onModAction} from "./handlers/modAction.js";
import {onPostCreate} from "./handlers/postCreate.js";
import {onPostSubmit} from "./handlers/postSubmit.js";
import {onRunClearOldPosts} from "./handlers/scheduler.js";
import {onPostDelete} from "./handlers/postDelete.js";

Devvit.configure({
    redditAPI: true,
    redis: true,
});

// Clear old posts and associated data
Devvit.addSchedulerJob({
    name: "clearOldPosts",
    onRun: onRunClearOldPosts,
});

// Handle enforcement
Devvit.addTrigger({
    event: "PostCreate",
    onEvent: onPostCreate,
});

// Handle tracking
Devvit.addTrigger({
    event: "PostSubmit",
    onEvent: onPostSubmit,
});

// Track mod action timestamps
Devvit.addTrigger({
    event: "ModAction",
    onEvent: onModAction,
});

// Track post deletion timestamps
Devvit.addTrigger({
    event: "PostDelete",
    onEvent: onPostDelete,
});

// Schedule clear job after install/upgrade
Devvit.addTrigger({
    events: ["AppInstall", "AppUpgrade"],
    onEvent: onAppChanged,
});

Devvit.addSettings([
    {
        type: "group",
        label: LABELS.QUOTA_SETTINGS,
        helpText: HELP_TEXT.QUOTA_SETTINGS,
        fields: [
            {
                type: "number",
                name: "quotaAmount",
                defaultValue: DEFAULTS.QUOTA_AMOUNT,
                label: LABELS.QUOTA_AMOUNT,
                helpText: HELP_TEXT.QUOTA_AMOUNT,
                onValidate: validatePositiveInteger,
            },
            {
                type: "number",
                name: "quotaPeriod",
                defaultValue: DEFAULTS.QUOTA_PERIOD,
                label: LABELS.QUOTA_PERIOD,
                helpText: HELP_TEXT.QUOTA_PERIOD,
                onValidate: async (event, context) => {
                    const validatePositiveNumberFailed = await validatePositiveNumber(event, context);
                    if (validatePositiveNumberFailed) {
                        return validatePositiveNumberFailed;
                    } else if (Number(event.value) > DEFAULTS.MAX_QUOTA_PERIOD) {
                        return ERRORS.QUOTA_PERIOD_TOO_LARGE;
                    }
                },
            },
            {
                type: "boolean",
                name: "ignoreModerators",
                defaultValue: DEFAULTS.IGNORE_MODERATORS,
                label: LABELS.IGNORE_MODERATORS,
                helpText: HELP_TEXT.IGNORE_MODERATORS,
            },
            {
                type: "boolean",
                name: "ignoreContributors",
                defaultValue: DEFAULTS.IGNORE_CONTRIBUTORS,
                label: LABELS.IGNORE_CONTRIBUTORS,
                helpText: HELP_TEXT.IGNORE_CONTRIBUTORS,
            },
            {
                type: "boolean",
                name: "ignoreAutoRemoved",
                defaultValue: DEFAULTS.IGNORE_AUTO_REMOVED,
                label: LABELS.IGNORE_AUTO_REMOVED,
                helpText: HELP_TEXT.IGNORE_AUTO_REMOVED,
            },
            {
                type: "boolean",
                name: "ignoreRemoved",
                defaultValue: DEFAULTS.IGNORE_REMOVED,
                label: LABELS.IGNORE_REMOVED,
                helpText: HELP_TEXT.IGNORE_REMOVED,
            },
            {
                type: "boolean",
                name: "ignoreDeleted",
                defaultValue: DEFAULTS.IGNORE_DELETED,
                label: LABELS.IGNORE_DELETED,
                helpText: HELP_TEXT.IGNORE_DELETED,
            },
        ],
    },
    {
        type: "group",
        label: LABELS.REMOVAL_SETTINGS,
        helpText: HELP_TEXT.REMOVAL_SETTINGS,
        fields: [
            {
                type: "string",
                name: "removalReasonId",
                label: LABELS.REMOVAL_REASON_ID,
                helpText: HELP_TEXT.REMOVAL_REASON_ID,
            },
            {
                type: "paragraph",
                name: "removalComment",
                defaultValue: DEFAULTS.REMOVAL_COMMENT,
                label: LABELS.REMOVAL_COMMENT,
                helpText: HELP_TEXT.REMOVAL_COMMENT,
            },
            {
                type: "group",
                label: LABELS.REMOVAL_FLAIR_SETTINGS,
                helpText: HELP_TEXT.REMOVAL_FLAIR_SETTINGS,
                fields: [
                    {
                        type: "string",
                        name: "removalFlairText",
                        label: LABELS.REMOVAL_FLAIR_TEXT,
                        helpText: HELP_TEXT.REMOVAL_FLAIR_TEXT,
                    },
                    {
                        type: "string",
                        name: "removalFlairCss",
                        label: LABELS.REMOVAL_FLAIR_CSS,
                        helpText: HELP_TEXT.REMOVAL_FLAIR_CSS,
                    },
                    {
                        type: "string",
                        name: "removalFlairId",
                        label: LABELS.REMOVAL_FLAIR_ID,
                        helpText: HELP_TEXT.REMOVAL_FLAIR_ID,
                    },
                ],
            },

        ],
    },
    {
        type: "group",
        label: LABELS.CUSTOM_DATE_SETTINGS,
        helpText: HELP_TEXT.CUSTOM_DATE_SETTINGS,
        fields: [
            {
                type: "string",
                name: "customTimeformat",
                defaultValue: DEFAULTS.CUSTOM_DATE_TEMPLATE,
                label: LABELS.CUSTOM_DATE_TEMPLATE,
                helpText: HELP_TEXT.CUSTOM_DATE_TEMPLATE,
                onValidate: validateCustomDateformat,
            },
            {
                type: "string",
                name: "customTimezone",
                defaultValue: DEFAULTS.CUSTOM_TIMEZONE,
                label: LABELS.CUSTOM_TIMEZONE,
                helpText: HELP_TEXT.CUSTOM_TIMEZONE,
                onValidate: validateCustomTimezone,
            },
            {
                type: "select",
                name: "customLocale",
                defaultValue: DEFAULTS.CUSTOM_LOCALE,
                label: LABELS.CUSTOM_LOCALE,
                options: LOCALE_OPTIONS,
                multiSelect: false,
                onValidate: validateCustomLocale,
            },
        ],
    },
]);

export default Devvit;
