import {Devvit} from "@devvit/public-api";
import {onAppChanged, onPostCreate, onPostSubmit, onRunClearOldPosts} from "./handlers/events.js";
import {LABELS, HELP_TEXT, DEFAULTS} from "./constants.js";
import {validateCustomDateTemplate, validateCustomLocale, validateCustomTimezone, validateQuotaAmount, validateQuotaPeriod} from "./handlers/validators.js";

Devvit.configure({
    kvStore: true,
    redditAPI: true,
});

Devvit.addSchedulerJob({
    name: "clearOldPosts",
    onRun: onRunClearOldPosts,
});

// Handle enforcement & tracking
Devvit.addTrigger({
    event: "PostCreate",
    onEvent: onPostCreate,
});

// Handle tracking
Devvit.addTrigger({
    event: "PostSubmit",
    onEvent: onPostSubmit,
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
                onValidate: validateQuotaAmount,
            },
            {
                type: "number",
                name: "quotaPeriod",
                defaultValue: DEFAULTS.QUOTA_PERIOD,
                label: LABELS.QUOTA_PERIOD,
                helpText: HELP_TEXT.QUOTA_PERIOD,
                onValidate: validateQuotaPeriod,
            },
            {
                type: "boolean",
                name: "ignoreAutoRemoved",
                defaultValue: DEFAULTS.IGNORE_AUTO_REMOVED,
                label: LABELS.IGNORE_AUTO_REMOVED,
                helpText: HELP_TEXT.IGNORE_AUTO_REMOVED,
            },
        ],
    },
    {
        type: "group",
        label: LABELS.REMOVAL_SETTINGS,
        helpText: HELP_TEXT.REMOVAL_SETTINGS,
        fields: [
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
                type: "paragraph",
                name: "quotaRemovalReason",
                defaultValue: DEFAULTS.QUOTA_REMOVAL_REASON,
                label: LABELS.QUOTA_REMOVAL_REASON,
                helpText: HELP_TEXT.QUOTA_REMOVAL_REASON,
            },
            {
                type: "group",
                label: LABELS.CUSTOM_DATE_GROUP,
                helpText: HELP_TEXT.CUSTOM_DATE_GROUP,
                fields: [
                    {
                        type: "string",
                        name: "customTimeformat",
                        defaultValue: DEFAULTS.CUSTOM_DATE_TEMPLATE,
                        label: LABELS.CUSTOM_DATE_TEMPLATE,
                        helpText: HELP_TEXT.CUSTOM_DATE_TEMPLATE,
                        onValidate: validateCustomDateTemplate,
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
                        type: "string",
                        name: "customLocale",
                        defaultValue: DEFAULTS.CUSTOM_LOCALE,
                        label: LABELS.CUSTOM_LOCALE,
                        helpText: HELP_TEXT.CUSTOM_LOCALE,
                        onValidate: validateCustomLocale,
                    },
                ],
            },
        ],
    },
]);

export default Devvit;
