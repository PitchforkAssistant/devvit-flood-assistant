// Links
export const LINKS = {
    TIMEFORMAT: "https://date-fns.org/v2.30.0/docs/format",
};

// Field labels
export const LABELS = {
    QUOTA_SETTINGS: "Quota Settings",
    QUOTA_AMOUNT: "Quota Amount",
    QUOTA_PERIOD: "Quota Period",
    IGNORE_MODERATORS: "Ignore Moderators",
    IGNORE_CONTRIBUTORS: "Ignore Contributors",
    IGNORE_AUTO_REMOVED: "Ignore Auto-Removed Posts",
    IGNORE_REMOVED: "Ignore Removed Posts",
    IGNORE_DELETED: "Ignore Deleted Posts",
    REMOVAL_SETTINGS: "Removal Settings",
    REMOVAL_REASON_ID: "Removal Reason ID",
    REMOVAL_COMMENT: "Removal Comment",
    REMOVAL_FLAIR_SETTINGS: "Removal Flair",
    REMOVAL_FLAIR_TEXT: "Removal Flair Text",
    REMOVAL_FLAIR_CSS: "Removal Flair CSS Class",
    REMOVAL_FLAIR_ID: "Removal Flair Template ID",
    CUSTOM_DATE_SETTINGS: "Custom Date Placeholder Options",
    CUSTOM_DATE_TEMPLATE: "Date Format Template",
    CUSTOM_TIMEZONE: "Timezone",
    CUSTOM_LOCALE: "Locale",
};

// Help labels
export const HELP_TEXT = {
    QUOTA_SETTINGS: "These settings control the number of posts allowed per user within a span of time and how they're counted.",
    QUOTA_AMOUNT: "Number of posts allowed per user within the quota period.",
    QUOTA_PERIOD: "Quota period in hours.",
    IGNORE_MODERATORS: "If this setting is enabled, this app will never remove posts by moderators.",
    IGNORE_CONTRIBUTORS: "If this setting is enabled, this app will never remove posts by users on the subreddit's approved submitters list.",
    IGNORE_AUTO_REMOVED: "If this setting is enabled, posts that are immediately removed after posting will not count towards the quota for future posts.",
    IGNORE_REMOVED: "If this setting is enabled, any posts that are removed by moderators will not count towards the quota for future posts.",
    IGNORE_DELETED: "If this setting is enabled, any posts that are deleted by the author will not count towards the quota for future posts.",
    REMOVAL_SETTINGS: "These settings let you configure a removal reason.",
    REMOVAL_REASON_ID: "If you have a native removal reason you'd wish to apply to removed posts, you can enter its ID here. Please note that Devvit doesn't currently send the corresponding removal reason to the user, so this is only visible to mods.",
    REMOVAL_COMMENT: "This is left as a stickied comment on posts that are removed for exceeding the quota. Leave blank to remove silently. Placeholders are supported.",
    REMOVAL_FLAIR_SETTINGS: "These settings let you add a flair to posts that are removed for exceeding the quota. If all are left blank, no flair will be added.",
    REMOVAL_FLAIR_TEXT: "Text to display on the removal flair. Placeholders are supported.",
    REMOVAL_FLAIR_CSS: "CSS class to apply to the removal flair.",
    REMOVAL_FLAIR_ID: "Template ID of the removal flair.",
    CUSTOM_DATE_SETTINGS: "These settings let you customize the {{time_custom}} placeholders. If your removal reason doesn't use a custom time placeholder, you can completely ignore these settings.",
    CUSTOM_DATE_TEMPLATE: `This is used by date-fns to format {{time_custom}}. See: ${LINKS.TIMEFORMAT}`,
    CUSTOM_TIMEZONE: "Timezone used for {{time_custom}}, must be a UTC offset or TZ identifier (e.g. UTC, +02:00, America/New_York, etc).",
    CUSTOM_LOCALE: "Locale used by {{time_custom}} (e.g. enUS, de, etc).",
};

// Default values
export const DEFAULTS = {
    QUOTA_AMOUNT: 4,
    QUOTA_PERIOD: 24,
    IGNORE_MODERATORS: true,
    IGNORE_CONTRIBUTORS: true,
    IGNORE_AUTO_REMOVED: true,
    IGNORE_REMOVED: false,
    IGNORE_DELETED: false,
    REMOVAL_COMMENT: "Hi /u/{{author}}! Thanks for posting to /r/{{subreddit}}. Unfortunately, [your {{kind}}]({{permalink}}) was removed for the following reason:\n\n* Please do not flood the subreddit with posts. You may only submit {{quota_amount}} posts within a {{quota_period}} hour period. Please wait a while and try again!\n\nIf you have questions about this, please [contact our mods via moderator mail](https://www.reddit.com/message/compose?to=/r/{{subreddit}}) rather than replying here. Thank you!",
    CUSTOM_DATE_TEMPLATE: "yyyy-MM-dd hh-mm-ss",
    CUSTOM_TIMEZONE: "UTC",
    CUSTOM_LOCALE: "enUS",
};

export const ERRORS = {
    QUOTA_PERIOD_TOO_LARGE: "Please do not set the quota period to more than 168 hours (7 days). The amount of posts that can be stored in the app storage is limited.",
};
