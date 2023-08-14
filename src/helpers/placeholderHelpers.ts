import {Locale} from "date-fns";
import {isValidDate, safeTimeformat} from "./dateHelpers.js";
import {domainFromUrlString} from "./miscHelpers.js";
import {Post} from "@devvit/public-api";

// Devvit does not support string.replaceAll() even if ES2021.String is specified in tsconfig.json.
function replaceAll (text: string, placeholder: string, replacement:string) : string {
    return text.replace(new RegExp(placeholder, "g"), replacement);
}

export function hasPlaceholders (text: string): boolean {
    return !!text && text.includes("{{") && text.includes("}}");
}

export function replacePlaceholders (text: string, post: Post, timeformat: string, timezone: string, locale: Locale, customPlaceholders?: Record<string, string>): string {
    // Skip everything if inputs are empty or contain no placeholders.
    if (!hasPlaceholders(text)) {
        return text;
    }

    const postId = post.id.substring(3) ?? "";
    const time = new Date();
    const createdAt = post.createdAt;
    const replacements = {
        "{{author}}": post.authorName ?? "",
        "{{subreddit}}": post.subredditName ?? "",
        "{{body}}": post.body ?? "",
        "{{title}}": post.title ?? "",
        "{{kind}}": "submission",
        "{{permalink}}": `https://redd.it/${postId}`,
        "{{url}}": `https://redd.it/${postId}`,
        "{{link}}": post.url ?? "",
        "{{domain}}": domainFromUrlString(post.url ?? ""),
        "{{author_id}}": post.authorId?.substring(3) ?? "",
        "{{subreddit_id}}": post.subredditId?.substring(3) ?? "",
        "{{id}}": postId,
        "{{link_flair_text}}": post.flair?.text ?? "",
        "{{link_flair_css_class}}": post.flair?.cssClass ?? "",
        "{{link_flair_template_id}}": post.flair?.templateId ?? "",
        "{{author_flair_text}}": "", // These aren't provided by the Post object and I don't want to make this function async.
        "{{author_flair_css_class}}": "",
        "{{author_flair_template_id}}": "",
        "{{time_iso}}": time.toISOString(),
        "{{time_unix}}": (time.getTime() / 1000).toString(),
        "{{time_custom}}": "",
        "{{created_iso}}": isValidDate(createdAt) ? createdAt.toISOString() : "",
        "{{created_unix}}": isValidDate(createdAt) ? (time.getTime() / 1000).toString() : "",
        "{{created_custom}}": "",
        "{{actioned_iso}}": time.toISOString(),
        "{{actioned_unix}}": (time.getTime() / 1000).toString(),
        "{{actioned_custom}}": "",
    };

    for (const [placeholder, replacement] of Object.entries(customPlaceholders ?? {})) {
        replacements[`{{${placeholder}}}`] = replacement;
    }

    if (timeformat) {
        replacements["{{time_custom}}"] = safeTimeformat(time, timeformat, timezone, locale);
        replacements["{{actioned_custom}}"] = safeTimeformat(time, timeformat, timezone, locale);
        replacements["{{created_custom}}"] = safeTimeformat(createdAt, timeformat, timezone, locale);
    }

    for (const [placeholder, replacement] of Object.entries(replacements)) {
        text = replaceAll(text, placeholder, replacement);
    }

    return text;
}
