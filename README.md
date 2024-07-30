# FloodingAssistant

FloodAssistant (or FloodingAssistant) is a Devvit app that allows you to restrict users to a certain number of posts within a certain time frame. [**View the full documentation on the wiki.**](https://www.reddit.com/r/PitchforkAssistant/wiki/floodassistant)

## Change Log

This section summarizes the changes made for each published version of the app, unpublished versions are not listed, but you can always view the full changes to the code on [GitHub](https://github.com/PitchforkAssistant/devvit-flood-assistant).

### 1.1.4

- Simplifies the check that was used for avoiding double-actioning posts that were removed before we could action them. This was causing failures to remove posts in some cases.

### 1.1.3

- Upgraded to a newer version of Devvit to resolve an issue where the app would break if the subreddit used the new "channels" and "chat_config" moderator permissions.

### 1.1.2

- Fixed an issue where custom date placeholder options were not being properly validated before saving. This could cause the app to crash if an invalid date format was entered. **I highly recommend hitting save on the app's settings page again to ensure those settings are valid.**

### 1.1.1

- Minor performance improvements, especially for subreddits with a large number of posts. More specifically, getPostsByAuthor now uses the recently added zScan method.

### 1.1.0

- The app now uses Devvit's new Redis client for tracking posts instead of the old KV store. 
  **Due to serious issues with the KV store, older versions of the apps may no longer work and must update to this version or beyond. For the same reason, it was not possible to migrate existing data to the new system. Updating to this version, all existing quotas will be reset.** 
- Major rewrite of the FloodAssistant's code. This should improve the app's reliability and maintainability.
- "Ignore Auto-Removed Posts" no longer needs to be enabled for posts removed by FloodAssistant to not count towards the quota, they will always be ignored.
- New placeholders: `{{quota_oldest_id}}`, `{{quota_oldest_url}}`, `{{quota_newest_id}}`, and `{{quota_newest_url}}`.

### 0.3.6

- The locale field is now a dropdown with all supported locales instead of a text box (previously very long dropdowns had issues). If you previously entered a custom locale, you may need to reselect it.
