# Flood^(ing)Assistant

FloodAssistant is a Devvit app that allows you to restrict users to a certain number of posts within a certain time frame. [View the full documentation on the wiki.](https://www.reddit.com/r/PitchforkAssistant/wiki/floodassistant)

## Change Log

This section summarizes the changes made for each published version of the app, unpublished versions are not listed, but you can always view the full changes to the code on [GitHub](https://github.com/PitchforkAssistant/devvit-flood-assistant).

### 1.1.0

- The app now uses Devvit's new Redis client for tracking posts instead of the old KV store. 
  **Due to serious issues with the KV store, older versions of the apps may no longer work and must update to this version or beyond. For the same reason, it was not possible to migrate existing data to the new system. Updating to this version, all existing quotas will be reset.** 
- Major rewrite of the FloodAssistant's code. This should improve the app's reliability and maintainability.
- "Ignore Auto-Removed Posts" no longer needs to be enabled for posts removed by FloodAssistant to not count towards the quota, they will always be ignored.
- New placeholders: `{{quota_oldest_id}}`, `{{quota_oldest_url}}`, `{{quota_newest_id}}`, and `{{quota_newest_url}}`.

### 0.3.6

- The locale field is now a dropdown with all supported locales instead of a text box (previously very long dropdowns had issues). If you previously entered a custom locale, you may need to reselect it.
