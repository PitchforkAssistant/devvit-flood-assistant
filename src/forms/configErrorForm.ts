import {Context, Devvit, FormFunction, FormKey, FormOnSubmitEvent, FormOnSubmitEventHandler} from "@devvit/public-api";
import {ERRORS, HELP_TEXT, LABELS} from "../constants.js";

type ErrorData = {
    errorName?: string;
    errorMessage?: string;
}

const form: FormFunction<ErrorData> = (data: ErrorData) => ({
    fields: [
        {
            type: "paragraph",
            name: "error",
            label: data.errorName ?? LABELS.FORM_CONFIG_ERROR_NAME,
            defaultValue: data.errorMessage ?? ERRORS.FORM_CONFIG_ERROR_MESSAGE,
            disabled: true,
        },
    ],
    title: LABELS.FORM_CONFIG_ERROR,
    description: HELP_TEXT.FORM_CONFIG_ERROR,
    acceptLabel: LABELS.FORM_CONFIG_ERROR_ACCEPT,
    cancelLabel: LABELS.FORM_CANCEL,
});

type ErrorFormSubmitData = {
    error?: string;
}

const formHandler: FormOnSubmitEventHandler<ErrorFormSubmitData> = async (event: FormOnSubmitEvent<ErrorFormSubmitData>, context: Context) => {
    const appAccount = await context.reddit.getAppUser();
    const subreddit = await context.reddit.getCurrentSubreddit();
    context.ui.navigateTo(`https://developers.reddit.com/r/${subreddit.name}/apps/${appAccount.username}`);
};

export const configErrorForm: FormKey = Devvit.createForm(form, formHandler);

