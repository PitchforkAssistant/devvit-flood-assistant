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

### Ignore Auto-Removed Posts

If this is enabled, posts that are removed as soon as they are posted will not count towards the quota. This also means that posts that are removed for exceeding the quota will not further add to the quota.

If this is disabled, all posts will count towards the quota, even if they are removed as soon as they are posted for any reason.

Please note that posts that are either later deleted by the author or removed by a moderator will always count towards the quota.

## Removal Settings

These settings let you ignore certain users and configure a removal reason.

### Ignore Moderators

If this is enabled, moderators of your subreddit will be ignored by this app.

### Ignore Contributors

If this is enabled, users that have been added to the approved submitters list on your subreddit will be ignored by this app.

### Removal Reason

This is left as a stickied comment on threads that are removed for flooding. If you leave this field blank, no comment will be left. 

This field supports [placeholders](#wiki_placeholders).


## Placeholders

Placeholders are keywords surrounded by double curly brackets, they are case-sensitive. Placeholders are replaced with their values when an action is performed. 

They are populated in no particular order. 

Any placeholders that are not applicable to the post are replaced with an empty string (ie. removed). 

Below is a list of all supported placeholders:

| Placeholder                    | Description                                                                                                     |
| :----------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| `{{quota_amount}}`             | Currently configured [Quota Amount](#wiki_quota_amount)                                                         |
| `{{quota_period}}`             | Currently configured [Quota Period](#wiki_quota_period)                                                         |
| `{{author}}`                   | Username of the author                                                                                          |
| `{{subreddit}}`                | Display name of the subreddit                                                                                   |
| `{{body}}`                     | Post's body (*not recommended*)                                                                                 |
| `{{title}}`                    | Title of the post                                                                                               |
| `{{kind}}`                     | Type of the post, always "submission"                                                                           |
| `{{permalink}}`                | Permalink to the post                                                                                           |
| `{{url}}`                      | Alias for `{{permalink}}`                                                                                       |
| `{{link}}`                     | The URL that the post links to, `{{permalink}}` for text posts                                                  |
| `{{domain}}`                   | The domain that the post links to, blank for text posts                                                         |
| `{{id}}`                       | Post ID                                                                                                         |
| `{{author_id}}`                | Author's User ID                                                                                                |
| `{{subreddit_id}}`             | Subreddit's ID                                                                                                  |
| `{{mod}}`                      | Username of the mod that set the flair                                                                          |
| `{{author_flair_text}}`        | Text of the post author's user flair                                                                            |
| `{{author_flair_css_class}}`   | CSS class of the post author's user flair                                                                       |
| `{{author_flair_template_id}}` | Template ID of the post author's user flair                                                                     |
| `{{link_flair_text}}`          | Text of the post's flair                                                                                        |
| `{{link_flair_css_class}}`     | CSS class of the post's flair                                                                                   |
| `{{link_flair_template_id}}`   | Template ID of the post's flair                                                                                 |
| `{{time_iso}}`                 | Current time in the ISO 8601 format                                                                             |
| `{{time_unix}}`                | Current time as the unix epoch in seconds                                                                       |
| `{{time_custom}}`              | Current time as defined by the [custom date placeholder options](#wiki_custom_date_placeholder_options)         |
| `{{created_iso}}`              | Post's creation time in the ISO 8601                                                                            |
| `{{created_unix}}`             | Post's creation time as the unix epoch in seconds                                                               |
| `{{created_custom}}`           | Post's creation time as defined by the [custom date placeholder options](#wiki_custom_date_placeholder_options) |
| `{{actioned_iso}}`             | Same as {{time_iso}}                                                                                            |
| `{{actioned_unix}}`            | Same as {{time_unix}}                                                                                           |
| `{{actioned_custom}}`          | Same as {{actioned_custom}}                                                                                     |

### Custom Date Placeholder Options

These settings are used with used for `{{created_custom}}`, `{{actioned_custom}}`, and `{{time_custom}}` placeholders. If your removal reason doesn't contain any of them, you can completely ignore these options.

#### Date Format Template

This date template is used for `{{created_custom}}`, `{{actioned_custom}}`, and `{{time_custom}}` placeholders. The application uses date-fns to format custom dates, the patterns for these are different from the Python timeformat Flair_Helper used. It uses the date formatting specified in the Unicode Technical Standard #35 with a few extra options, [view a full list of patterns supported by date-fns](https://date-fns.org/v2.30.0/docs/format). The default value is `yyyy-MM-dd HH-mm-ss`, below is a list of some common patterns:


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

This is the timezone used for `{{created_custom}}`, `{{actioned_custom}}`, and `{{time_custom}}` placeholders. The default value is `UTC`. This field can accept both timezone identifiers and offsets. [View a full list of supported timezones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) or simply provide it in the format `+HH:mm` or `-HH:mm` (ie. `+05:30` or `-08:00`).

#### Locale

This field is used for `{{created_custom}}`, `{{actioned_custom}}`, and `{{time_custom}}` placeholders. It affects locale specific values such as the first day of the week, month names, abbrivations, etc. The default value is `enUS`. Below is a table of all supported locales:

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
