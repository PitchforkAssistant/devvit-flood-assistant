// Links
export const LINKS = {
    TIMEFORMAT: "https://date-fns.org/v2.30.0/docs/format",
};

// Field labels
export const LABELS = {
    QUOTA_SETTINGS: "Quota Settings",
    QUOTA_AMOUNT: "Quota Amount",
    QUOTA_PERIOD: "Quota Period",
    IGNORE_AUTO_REMOVED: "Ignore Auto-Removed Posts",
    REMOVAL_SETTINGS: "Removal Settings",
    IGNORE_MODERATORS: "Ignore Moderators",
    IGNORE_CONTRIBUTORS: "Ignore Contributors",
    QUOTA_REMOVAL_REASON: "Removal Reason",
    CUSTOM_DATE_GROUP: "Custom Date Placeholder Options",
    CUSTOM_DATE_TEMPLATE: "Date Format Template",
    CUSTOM_TIMEZONE: "Timezone",
    CUSTOM_LOCALE: "Locale",
};

// Help labels
export const HELP_TEXT = {
    QUOTA_SETTINGS: "These settings control the number of posts allowed per user within a span of time and how they're counted.",
    QUOTA_AMOUNT: "Number of posts allowed per user within the quota period.",
    QUOTA_PERIOD: "Quota period in hours.",
    IGNORE_AUTO_REMOVED: "If this setting is enabled, posts that are immediately removed after posting will not count towards the quota.",
    REMOVAL_SETTINGS: "These settings let you ignore certain users and configure a removal reason.",
    IGNORE_MODERATORS: "If this setting is enabled, this app will never remove posts by moderators.",
    IGNORE_CONTRIBUTORS: "If this setting is enabled, this app will never remove posts by users on the subreddit's approved submitters list.",
    QUOTA_REMOVAL_REASON: "This is left as a stickied comment on posts that are removed for exceeding the quota. Leave blank to remove silently. Placeholders are supported.",
    CUSTOM_DATE_GROUP: "These settings let you customize the {{time_custom}} placeholder. If your removal reason doesn't use this placeholder, you can completely ignore these settings.",
    CUSTOM_DATE_TEMPLATE: `This is used by date-fns to format {{time_custom}}. See: ${LINKS.TIMEFORMAT}`,
    CUSTOM_TIMEZONE: "Timezone used for {{time_custom}}, must be a UTC offset or TZ identifier (e.g. UTC, +02:00, America/New_York, etc).",
    CUSTOM_LOCALE: "Locale used by {{time_custom}} (e.g. enUS, de, etc).",
};

// Default values
export const DEFAULTS = {
    QUOTA_AMOUNT: 4,
    QUOTA_PERIOD: 24,
    IGNORE_AUTO_REMOVED: true,
    IGNORE_MODERATORS: true,
    IGNORE_CONTRIBUTORS: false,
    QUOTA_REMOVAL_REASON: "Hi /u/{{author}}! Thanks for posting to /r/{{subreddit}}. Unfortunately, [your {{kind}}]({{permalink}}) was removed for the following reason:\n\n* Please do not flood the subreddit with posts. You may only submit {{quota_amount}} posts within a {{quota_period}} hour period. Please wait a while and try again!\n\nIf you have questions about this, please [contact our mods via moderator mail](https://www.reddit.com/message/compose?to=/r/{{subreddit}}) rather than replying here. Thank you!",
    CUSTOM_DATE_TEMPLATE: "yyyy-MM-dd hh-mm-ss",
    CUSTOM_TIMEZONE: "UTC",
    CUSTOM_LOCALE: "enUS",
};

// Validation error messages
export const ERRORS = {
    QUOTA_AMOUNT_NAN: "This value must be a number.",
    QUOTA_AMOUNT_NEGATIVE: "This value must be a positive number, how would you even make a negative number of posts?",
    QUOTA_AMOUNT_NOT_INTEGER: "This value must be an integer, how would you even make a fractional number of posts?",
    QUOTA_PERIOD_NAN: "This value must be a number.",
    QUOTA_PERIOD_NEGATIVE: "This value must be a positive number, time travel is not supported.",
    QUOTA_PERIOD_TOO_LARGE: "Please do not set to quota period to more than 168 hours (7 days). The amount of posts that can be stored in the app storage is limited.",
    INVALID_TIMEFORMAT: `Invalid timeformat, see: ${LINKS.TIMEFORMAT}`,
    INVALID_TIMEZONE: "That is not a valid UTC offset or TZ identifier.",
    INVALID_LOCALE: "That is not a valid locale.",
};
