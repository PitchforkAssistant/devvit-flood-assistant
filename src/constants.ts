import {QuotaExclusionReason} from "./evaluators.js";

export const LATEST_VERSION = 0;

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
    REMOVAL_LOCK: "Lock Removed Posts",
    REMOVAL_COMMENT: "Removal Comment",
    REMOVAL_FLAIR_SETTINGS: "Removal Flair",
    REMOVAL_FLAIR_TEXT: "Removal Flair Text",
    REMOVAL_FLAIR_CSS: "Removal Flair CSS Class",
    REMOVAL_FLAIR_ID: "Removal Flair Template ID",
    CUSTOM_DATE_SETTINGS: "Custom Date Placeholder Options",
    CUSTOM_DATE_TEMPLATE: "Date Format Template",
    CUSTOM_TIMEZONE: "Timezone",
    CUSTOM_LOCALE: "Locale",
    BUTTON_QUOTA: "Check User's Quota",
    FORM_CONFIG_ERROR: "Config Error",
    FORM_CONFIG_ERROR_NAME: "Unspecified Error Name",
    FORM_CONFIG_ERROR_ACCEPT: "Open App Settings",
    FORM_CANCEL: "Close",
    FORM_ENTER_USERNAME: "Username",
    FORM_ENTER_USER_ACCEPT: "Lookup",
    FORM_USER_QUOTA_INFO: "User Quota Information",
    FORM_TRACKED_POSTS: "Tracked Posts",
    FORM_QUOTA_POSTS: "Quota Posts",
    FORM_USER_QUOTA_INFO_ACCEPT: "View Selected Post",
    FORM_SELECT_POST: "Select Post",
    FORM_NEXT_POST_OPPORTUNITY: "Next Post Opportunity",
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
    REMOVAL_LOCK: "If this setting is enabled, removed posts will be locked.",
    REMOVAL_COMMENT: "This is left as a stickied comment on posts that are removed for exceeding the quota. Leave blank to remove silently. Placeholders are supported.",
    REMOVAL_FLAIR_SETTINGS: "These settings let you add a flair to posts that are removed for exceeding the quota. If all are left blank, no flair will be added.",
    REMOVAL_FLAIR_TEXT: "Text to display on the removal flair. Placeholders are supported.",
    REMOVAL_FLAIR_CSS: "CSS class to apply to the removal flair.",
    REMOVAL_FLAIR_ID: "Template ID of the removal flair.",
    CUSTOM_DATE_SETTINGS: "These settings let you customize the {{time_custom}} placeholders. If you don't use any custom time placeholders, you can completely ignore these settings.",
    CUSTOM_DATE_TEMPLATE: `This is used by date-fns to format {{time_custom}}. See: ${LINKS.TIMEFORMAT}`,
    CUSTOM_TIMEZONE: "Timezone used for {{time_custom}}, must be a UTC offset or TZ identifier (e.g. UTC, +02:00, America/New_York, etc).",
    CUSTOM_LOCALE: "Locale used by {{time_custom}} (e.g. enUS, de, etc).",
    BUTTON_QUOTA: "Check the current state of a user's post quota.",
    FORM_CONFIG_ERROR: "An error occurred while loading the app settings.",
    FORM_ENTER_USERNAME: "Enter the username of the user whose post quota you want to check.",
    FORM_USER_QUOTA_INFO: "This form shows the posts that are currently being tracked for the user, as well as whether those posts are count towards the user's post quota.",
    FORM_NEXT_POST_OPPORTUNITY: "This is when the user will have an empty spot in their post limit quota.",
    FORM_SELECT_POST: "You will be directed to view the selected post after submitting the form.",
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
    REMOVAL_LOCK: false,
    REMOVAL_COMMENT: "Hi /u/{{author}}! Thanks for posting to /r/{{subreddit}}. Unfortunately, [your {{kind}}]({{permalink}}) was removed for the following reason:\n\n* Please do not flood the subreddit with posts. You may only submit {{quota_amount}} posts within a {{quota_period}} hour period. Please wait a while and try again!\n\nIf you have questions about this, please [contact our mods via moderator mail](https://www.reddit.com/message/compose?to=/r/{{subreddit}}) rather than replying here. Thank you!",
    CUSTOM_DATE_TEMPLATE: "yyyy-MM-dd hh-mm-ss",
    CUSTOM_TIMEZONE: "UTC",
    CUSTOM_LOCALE: ["enUS"],
    MAX_QUOTA_PERIOD: 744,
};

export const ERRORS = {
    QUOTA_PERIOD_TOO_LARGE: "Please do not set the quota period to more than 744 hours (31 days). The amount of posts that can be stored in the app storage is limited.",
    FORM_CONFIG_ERROR_MESSAGE: "Unspecified Error Message",
    FORM_NO_USER: "ERROR: You must enter a username.",
    FORM_INVALID_USER: "ERROR: Failed to get user. Does the user exist?",
    FORM_NO_POST_SELECTED: "You did not select a post to navigate to, closing form.",
};

// Important keys
export const KEYS = {
    QUOTA_AMOUNT: "quotaAmount",
    QUOTA_PERIOD: "quotaPeriod",
    IGNORE_MODS: "ignoreModerators",
    IGNORE_MEMBERS: "ignoreContributors",
    IGNORE_AUTO_REMOVED: "ignoreAutoRemoved",
    IGNORE_REMOVED: "ignoreRemoved",
    IGNORE_DELETED: "ignoreDeleted",
    REMOVAL_REASON_ID: "removalReasonId",
    REMOVAL_LOCK: "removalLock",
    REMOVAL_COMMENT: "removalComment",
    REMOVAL_FLAIR_TEXT: "removalFlairText",
    REMOVAL_FLAIR_CSS: "removalFlairCss",
    REMOVAL_FLAIR_ID: "removalFlairId",
    CUSTOM_DATE_TEMPLATE: "customTimeformat",
    CUSTOM_TIMEZONE: "customTimezone",
    CUSTOM_LOCALE: "customLocale",
    JOB_CLEAR: "clearOldPosts",
    INSTALL_VERSION: "installedVersion",
};

export const EXCLUSION_REASONS: Record<QuotaExclusionReason, string> = {
    age: "Older Than Quota Period",
    autoRemoved: "Ignoring Auto-Removed Posts",
    currentPost: "Ignoring Current Post",
    deleted: "Ignoring Deleted Posts",
    removed: "Ignoring Removed Posts",
    floodingRemoved: "Flooding Removed",
};
