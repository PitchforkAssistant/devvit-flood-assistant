import {Context, Devvit, Form, FormKey, FormOnSubmitEvent, FormOnSubmitEventHandler, User} from "@devvit/public-api";
import {ERRORS, HELP_TEXT, LABELS} from "../constants.js";
import {getPostsByAuthor} from "../helpers/redisHelpers.js";
import {FloodingEvaluator} from "../evaluators.js";
import {getFloodAssistantConfigSlow} from "../appConfig.js";
import {PostBasics, QuotaData} from "./userQuotaForm.js";
import {userQuotaForm} from "../main.js";

const form: Form = {
    fields: [
        {
            type: "string",
            name: "username",
            label: LABELS.FORM_ENTER_USERNAME,
            helpText: HELP_TEXT.FORM_ENTER_USERNAME,
            required: true,
            placeholder: "username",
        },
    ],
    title: LABELS.BUTTON_QUOTA,
    description: HELP_TEXT.BUTTON_QUOTA,
    acceptLabel: LABELS.FORM_ENTER_USER_ACCEPT,
    cancelLabel: LABELS.FORM_CANCEL,
};

const formHandler: FormOnSubmitEventHandler = async (event: FormOnSubmitEvent, context: Context) => {
    const username: unknown = event.values.username;
    if (!username || typeof username !== "string") {
        context.ui.showToast({text: ERRORS.FORM_NO_USER, appearance: "neutral"});
        return;
    }

    let user: User | undefined;
    try {
        user = await context.reddit.getUserByUsername(username);
    } catch (e) {
        console.log("Error getting user in form: ", e);
        context.ui.showToast({text: ERRORS.FORM_INVALID_USER, appearance: "neutral"});
        return;
    }

    console.log("Lookup quota for ", user.username);
    const trackedPostsRecord = await getPostsByAuthor(context.redis, user.id);

    if (Object.keys(trackedPostsRecord).length === 0) {
        context.ui.showToast({text: `No tracked posts found for /u/${user.username}.`, appearance: "neutral"});
        return;
    }

    const subreddit = await context.reddit.getCurrentSubreddit();
    const config = await getFloodAssistantConfigSlow(context.settings);
    const evaluator = new FloodingEvaluator(config, context.reddit, context.redis, subreddit, user);

    const postBasics: PostBasics[] = [];
    for (const postId of Object.keys(trackedPostsRecord)) {
        const post = await context.reddit.getPostById(postId);
        postBasics.push({
            id: post.id,
            title: post.title,
            createdAt: trackedPostsRecord[postId].getTime(),
            quotaIncluded: await evaluator.countsTowardQuota(post),
        });
    }

    const data: QuotaData = {
        posts: postBasics,
        authorId: user.id,
        authorName: user.username,
        nextPostOpportunity: (await evaluator.getNextPostOpportunity()).getTime(),
    };

    console.log("User Quota Form Data: ", data);
    context.ui.showForm(userQuotaForm, data);
};

export const enterUserForm: FormKey = Devvit.createForm(form, formHandler);
