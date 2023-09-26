# About

Flood^(ing) Assistant prevents users from making too many posts in a short span of time, thus flooding the subreddit feed. You can configure both the number of posts and time period.

App: https://developers.reddit.com/apps/floodassistant

Source: https://github.com/PitchforkAssistant/devvit-flood-assistant

# Configuration

This app has configurable settings for each of its subreddits. If you have installed it on your subreddit, you can find its settings at `https://developers.reddit.com/r/subreddit/apps/floodassistant` or by going to Mod Tools -> Installed Apps on new Reddit and clicking the Settings button next to Flooding Assistant.

If you stick to the default settings, the app will limit non-moderators to 4 posts per 24 hours. I would suggest hitting the "Save changes" button even if you don't change anything, just to prevent any odd behavior.

## Quota Settings

These settings configure how many posts can be posted in a given time period.

### Quota Amount

This is the number of posts that can be posted in the configured quota period. 

If a user posts more than this number of posts in the configured period, they will be removed. The user will be able to make more posts once the older posts age out of the quota period.

### Quota Period

This is the time period in which the quota period is enforced. This field is a number of hours. The hours can be fractional, for example `0.5` is 30 minutes. The maximum is `168` hours (7 days).

### Ignore Moderators

If this is enabled, moderators of your subreddit will be ignored by this app.

### Ignore Contributors

If this is enabled, users that have been added to the approved submitters list on your subreddit will be ignored by this app.

### Ignore Auto-Removed Posts

If this is enabled, posts that are removed within 60 seconds of posting will not count towards the quota. This also means that posts that are removed for exceeding the quota will not further add to the quota.

If this is disabled, all posts will count towards the quota, even if they are removed as soon as they are posted for any reason.

### Ignore Removed Posts

If this is enabled, posts that are removed by moderators will not count towards the quota. This also effectively enables the "Ignore Auto-Removed Posts" setting.

Posts are readded to the quota if they are approved after being removed and still fall within the quota period.

### Ignore Deleted Posts

If this is enabled, posts that are deleted by the author will not count towards the quota.

If "Ignore Removed Posts" is disabled, posts that are removed by moderators and later deleted by the author will still count towards the quota.

## Removal Settings

These settings let you configure what happens after a post is removed for exceeding the quota.

### Removal Reason ID

If your subreddit uses native removal reasons and you would like the app to use one of them, you can provide the ID of the removal reason here. If you leave this field blank, the app will not apply a native removal reason.

You can find the IDs of your subreddit's removal reasons by using the [Show Removal Reason IDs](https://developers.reddit.com/r/PitchforkAssistant/apps/removalreasonids) Devvit app or by fetching them using the `https://oauth.reddit.com/api/v1/subreddit/removal_reasons.json` endpoint.

Please note that this is only visible to moderators. Devvit does not currently send a removal message to the author when a native removal reason is applied. If you would like to add a user-visible removal reason, you will need to use the [Removal Comment](#wiki_removal_comment) or [Removal Flair](#wiki_removal_flair) fields instead.

### Removal Comment

This is left as a stickied comment on threads that are removed for flooding. If you leave this field blank, no comment will be left. 

This field supports [placeholders](#wiki_placeholders).

### Removal Flair

These settings configure the flair that is applied to posts that are removed for flooding. At least one is required, if you leave all three fields blank, no flair will be applied.

#### Removal Flair Text

This is the text that is displayed on the flair. This field supports [placeholders](#wiki_placeholders).

#### Removal Flair CSS Class

This is the CSS class that is applied to the flair.

#### Removal Flair Template ID

This is the ID of the flair template that is applied to the post. A templateId should look something like this: `099e12cb-6da5-4c9b-831d-7316dd18a3d6`.

The easiest way to find a post flair template ID is to go to Mod Tools -> Post Flair on new Reddit and click on copy ID.


### Placeholders

Placeholders are keywords surrounded by double curly brackets, they are case-sensitive. Placeholders are replaced with their values when an action is performed. 

They are populated in no particular order. 

Any placeholders that are not applicable to the post are replaced with an empty string (ie. removed). 

Below is a list of all supported placeholders:

| Placeholder                    | Description                                                                                                                        |
| :----------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| `{{quota_amount}}`             | Currently configured [Quota Amount](#wiki_quota_amount)                                                                            |
| `{{quota_period}}`             | Currently configured [Quota Period](#wiki_quota_period)                                                                            |
| `{{quota_next_iso}}`           | When the user will be able to post next in the ISO 8601 format                                                                     |
| `{{quota_next_unix}}`          | When the user will be able to post next as the unix epoch in seconds                                                               |
| `{{quota_next_custom}}`        | When the user will be able to post next as defined by the [custom date placeholder options](#wiki_custom_date_placeholder_options) |
| `{{author}}`                   | Username of the author                                                                                                             |
| `{{subreddit}}`                | Display name of the subreddit                                                                                                      |
| `{{body}}`                     | Post's body (*not recommended*)                                                                                                    |
| `{{title}}`                    | Title of the post                                                                                                                  |
| `{{kind}}`                     | Type of the post, always "submission"                                                                                              |
| `{{permalink}}`                | Permalink to the post                                                                                                              |
| `{{url}}`                      | Alias for `{{permalink}}`                                                                                                          |
| `{{link}}`                     | The URL that the post links to, `{{permalink}}` for text posts                                                                     |
| `{{domain}}`                   | The domain that the post links to, blank for text posts                                                                            |
| `{{id}}`                       | Post ID                                                                                                                            |
| `{{author_id}}`                | Author's User ID                                                                                                                   |
| `{{subreddit_id}}`             | Subreddit's ID                                                                                                                     |
| `{{mod}}`                      | Username of the mod that set the flair                                                                                             |
| `{{author_flair_text}}`        | Text of the post author's user flair                                                                                               |
| `{{author_flair_css_class}}`   | CSS class of the post author's user flair                                                                                          |
| `{{author_flair_template_id}}` | Template ID of the post author's user flair                                                                                        |
| `{{link_flair_text}}`          | Text of the post's flair                                                                                                           |
| `{{link_flair_css_class}}`     | CSS class of the post's flair                                                                                                      |
| `{{link_flair_template_id}}`   | Template ID of the post's flair                                                                                                    |
| `{{time_iso}}`                 | Current time in the ISO 8601 format                                                                                                |
| `{{time_unix}}`                | Current time as the unix epoch in seconds                                                                                          |
| `{{time_custom}}`              | Current time as defined by the [custom date placeholder options](#wiki_custom_date_placeholder_options)                            |
| `{{created_iso}}`              | Post's creation time in the ISO 8601 format                                                                                        |
| `{{created_unix}}`             | Post's creation time as the unix epoch in seconds                                                                                  |
| `{{created_custom}}`           | Post's creation time as defined by the [custom date placeholder options](#wiki_custom_date_placeholder_options)                    |


### Custom Date Placeholder Options

These settings are used with used for `{{created_custom}}`, `{{quota_next_custom}}`, and `{{time_custom}}` placeholders. If your removal reason doesn't contain any of them, you can completely ignore these options.

#### Date Format Template

This date template is used for `{{created_custom}}`, `{{quota_next_custom}}`, and `{{time_custom}}` placeholders. The application uses date-fns to format custom dates, the patterns for these are different from the Python timeformat Flair_Helper used. It uses the date formatting specified in the Unicode Technical Standard #35 with a few extra options, [view a full list of patterns supported by date-fns](https://date-fns.org/v2.30.0/docs/format). The default value is `yyyy-MM-dd HH-mm-ss`, below is a list of some common patterns:


| Name   | Pattern(s)          | Example(s)           |
| :----- | :------------------ | :------------------- |
| Year   | yy, yyyy            | 23, 2023             |
| Month  | M, MM, MMM, MMMM    | 7, 07, Jul, July     |
| Day    | d, dd, E, EEEE      | 1, 01, Sat, Saturday |
| Hour   | h, hh, H, HH        | 1, 01, 13, 13        |
| Minute | m, mm               | 3, 03                |
| Second | s, ss               | 2, 02                |
| Text   | yyyy'y' MMMM 'text' | 2023y July text      |

#### Timezone

This is the timezone used for `{{created_custom}}`, `{{quota_next_custom}}`, and `{{time_custom}}` placeholders. The default value is `UTC`. This field can accept both timezone identifiers and offsets. [View a full list of supported timezones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) or simply provide it in the format `+HH:mm` or `-HH:mm` (ie. `+05:30` or `-08:00`).

#### Locale

This field is used for `{{created_custom}}`, `{{quota_next_custom}}`, and `{{time_custom}}` placeholders. It affects locale specific values such as the first day of the week, month names, abbrivations, etc. The default value is `enUS`. Below is a table of all supported locales:

| Name                      | Value      |
| :------------------------ | :--------- |
| Afrikaans                 | `af`       |
| Arabic                    | `ar`       |
| Arabic - Algeria          | `arDZ`     |
| Arabic - Egypt            | `arEG`     |
| Arabic - Morocco          | `arMA`     |
| Arabic - Saudi Arabia     | `arSA`     |
| Arabic - Tunisia          | `arTN`     |
| Azeri                     | `az`       |
| Belarusian                | `be`       |
| Belarusian - Taraškievica | `beTarask` |
| Bulgarian                 | `bg`       |
| Bengali                   | `bn`       |
| Bosnian                   | `bs`       |
| Catalan                   | `ca`       |
| Czech                     | `cs`       |
| Welsh                     | `cy`       |
| Danish                    | `da`       |
| German                    | `de`       |
| German - Austria          | `deAT`     |
| Greek                     | `el`       |
| English - Australia       | `enAU`     |
| English - Canada          | `enCA`     |
| English - Great Britain   | `enGB`     |
| English - Ireland         | `enIE`     |
| English - India           | `enIN`     |
| English - New Zealand     | `enNZ`     |
| English - United States   | `enUS`     |
| English - Zimbabwe        | `enZA`     |
| Esperanto                 | `eo`       |
| Spanish                   | `es`       |
| Estonian                  | `et`       |
| Basque                    | `eu`       |
| Farsi - Iran              | `faIR`     |
| Finnish                   | `fi`       |
| French                    | `fr`       |
| French - Canada           | `frCA`     |
| French - Switzerland      | `frCH`     |
| Frisian                   | `fy`       |
| Gaelic                    | `gd`       |
| Galician                  | `gl`       |
| Gujarati                  | `gu`       |
| Hebrew                    | `he`       |
| Hindi                     | `hi`       |
| Croatian                  | `hr`       |
| Haitian Creole            | `ht`       |
| Hungarian                 | `hu`       |
| Armenian                  | `hy`       |
| Indonesian                | `id`       |
| Icelandic                 | `is`       |
| Italian                   | `it`       |
| Italian - Switzerland     | `itCH`     |
| Japanese                  | `ja`       |
| Japanese - Hiragana       | `jaHira`   |
| Georgian                  | `ka`       |
| Kazakh                    | `kk`       |
| Khmer                     | `km`       |
| Kannada                   | `kn`       |
| Korean                    | `ko`       |
| Luxembourgish             | `lb`       |
| Lithuanian                | `lt`       |
| Latvian                   | `lv`       |
| Macedonian                | `mk`       |
| Mongolian                 | `mn`       |
| Malay                     | `ms`       |
| Maltese                   | `mt`       |
| Norwegian - Bokml         | `nb`       |
| Dutch                     | `nl`       |
| Dutch - Belgium           | `nlBE`     |
| Norwegian - Nynorsk       | `nn`       |
| Occitan                   | `oc`       |
| Polish                    | `pl`       |
| Portuguese                | `pt`       |
| Portuguese - Brazil       | `ptBR`     |
| Romanian                  | `ro`       |
| Russian                   | `ru`       |
| Slovak                    | `sk`       |
| Slovenian                 | `sl`       |
| Albanian                  | `sq`       |
| Serbian - Cyrillic        | `sr`       |
| Serbian - Latin           | `srLatn`   |
| Swedish                   | `sv`       |
| Tamil                     | `ta`       |
| Telugu                    | `te`       |
| Thai                      | `th`       |
| Turkish                   | `tr`       |
| Uyghur                    | `ug`       |
| Ukrainian                 | `uk`       |
| Uzbek - Latin             | `uz`       |
| Uzbek - Cyrillic          | `uzCyrl`   |
| Vietnamese                | `vi`       |
| Chinese                   | `zhCN`     |
| Chinese - Hong Kong       | `zhHK`     |
| Chinese - Taiwan          | `zhTW`     |
