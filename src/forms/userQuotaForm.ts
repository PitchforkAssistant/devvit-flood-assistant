import {Context, Data, Devvit, FormFunction, FormKey, FormOnSubmitEvent, FormOnSubmitEventHandler} from "@devvit/public-api";
import {ERRORS, EXCLUSION_REASONS, HELP_TEXT, LABELS} from "../constants.js";
import {QuotaIncludedResult} from "../evaluators.js";

export interface PostBasics {
    createdAt: number;
    id: string;
    title: string;
    quotaIncluded: QuotaIncludedResult;
}

export interface QuotaData extends Data {
    posts?: PostBasics[];
    authorId?: string;
    authorName?: string;
    nextPostOpportunity?: number;
}

const form: FormFunction = (data: QuotaData) => ({
    fields: [
        {
            type: "group",
            name: "posts",
            label: `${LABELS.FORM_TRACKED_POSTS}${data.authorName ? ` - ${data.authorName}` : ""}`,
            disabled: true,
            fields: data.posts?.map(post => ({
                type: "group",
                name: `group-${post.id}`,
                label: `${post.title}`,
                fields: [
                    {
                        type: "string",
                        name: `string-${post.id}`,
                        label: `${post.id.substring(3)}`,
                        helpText: `Created: ${new Date(post.createdAt).toISOString()}`,
                        disabled: true,
                        defaultValue: post.quotaIncluded.included ? "Included In Quota" : `Excluded (Reason: ${EXCLUSION_REASONS[post.quotaIncluded.exclusionReason]})`,
                    },
                ],
            })) ?? [],
        },
        {
            type: "string",
            name: "nextPostOpportunity",
            label: LABELS.FORM_NEXT_POST_OPPORTUNITY,
            helpText: HELP_TEXT.FORM_NEXT_POST_OPPORTUNITY,
            defaultValue: data.nextPostOpportunity ? new Date(data.nextPostOpportunity).toISOString() : "Unknown",
            disabled: true,
        },
        {
            type: "select",
            name: "selectPost",
            label: LABELS.FORM_SELECT_POST,
            helpText: HELP_TEXT.FORM_SELECT_POST,
            multiSelect: false,
            options: data.posts?.map(post => ({label: `${post.id.substring(3)}: ${post.title}`, value: post.id})) ?? [],
        },
    ],
    title: LABELS.FORM_USER_QUOTA_INFO,
    description: HELP_TEXT.FORM_USER_QUOTA_INFO,
    acceptLabel: LABELS.FORM_USER_QUOTA_INFO_ACCEPT,
    cancelLabel: LABELS.FORM_CANCEL,
});

const formHandler: FormOnSubmitEventHandler = async (event: FormOnSubmitEvent, context: Context) => {
    if (!Array.isArray(event.values.selectPost) || event.values.selectPost.length === 0 || !event.values.selectPost[0] || typeof event.values.selectPost[0] !== "string") {
        context.ui.showToast({text: ERRORS.FORM_NO_POST_SELECTED, appearance: "neutral"});
        return;
    }

    const postId = event.values.selectPost[0];
    context.ui.navigateTo(`https://reddit.com/comments/${postId.substring(3)}`);
};

export const userQuotaForm: FormKey = Devvit.createForm(form, formHandler);
