import {Context, Devvit, Form, FormKey, FormOnSubmitEvent, FormOnSubmitEventHandler, User} from "@devvit/public-api";
import {ERRORS, HELP_TEXT, LABELS} from "../constants.js";
import {getTrackedPostsByAuthor} from "../core/redis/trackedPosts.js";
import {FloodingEvaluator} from "../core/evaluators.js";
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

export type EnterUserFormSubmitData = {
    username?: string;
}

const formHandler: FormOnSubmitEventHandler<EnterUserFormSubmitData> = async (event: FormOnSubmitEvent<EnterUserFormSubmitData>, {redis, settings, reddit, ui}: Context) => {
    const username = event.values.username;
    if (!username || typeof username !== "string") {
        ui.showToast({text: ERRORS.FORM_NO_USER, appearance: "neutral"});
        return;
    }

    let user: User | undefined;
    try {
        if (username.startsWith("!")) {
            user = await reddit.getUserById(username.slice(1));
        } else {
            user = await reddit.getUserByUsername(username);
        }
        if (!user) {
            throw new Error("User undefined");
        }
    } catch (e) {
        console.log("Error getting user in form: ", e);
        ui.showToast({text: ERRORS.FORM_INVALID_USER, appearance: "neutral"});
        return;
    }

    console.log("Lookup quota for ", user.username);
    const trackedPostsRecord = await getTrackedPostsByAuthor({redis, authorId: user.id});

    if (Object.keys(trackedPostsRecord).length === 0) {
        ui.showToast({text: `No tracked posts found for /u/${user.username}.`, appearance: "neutral"});
        return;
    }

    const subreddit = await reddit.getCurrentSubreddit();
    const config = await getFloodAssistantConfigSlow(settings);
    const evaluator = new FloodingEvaluator(config, reddit, redis, subreddit, user);

    const postBasics: PostBasics[] = [];
    for (const postId of Object.keys(trackedPostsRecord)) {
        const post = await reddit.getPostById(postId);
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
    ui.showForm(userQuotaForm, data);
};

export const enterUserForm: FormKey = Devvit.createForm(form, formHandler);
