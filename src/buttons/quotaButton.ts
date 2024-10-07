import {Context, Devvit, MenuItemOnPressEvent} from "@devvit/public-api";
import {HELP_TEXT, LABELS} from "../constants.js";
import {getFloodAssistantConfigSlow} from "../appConfig.js";
import {configErrorForm, enterUserForm} from "../main.js";

const onPress = async (event: MenuItemOnPressEvent, context: Context) => {
    console.log("Quota form opened: ", event);
    try {
        const config = await getFloodAssistantConfigSlow(context.settings);
        console.log("FloodAssistantConfig: ", config);
        context.ui.showForm(enterUserForm);
    } catch (e) {
        const error = e as Error;
        if (error.name === "FloodAssistantConfigError") {
            console.error(`Error getting FloodAssistantConfig: ${String(e)}`);
            context.ui.showForm(configErrorForm, {errorName: error.name, errorMessage: error.message});
            return;
        } else {
            console.error(`Error opening quota form: ${String(e)}`);
            context.ui.showToast({text: `ERROR: Something went wrong while trying to open the form. (${error.name})`, appearance: "neutral"});
            return;
        }
    }
};

export const quotaButton = Devvit.addMenuItem({
    location: "subreddit",
    forUserType: "moderator",
    label: LABELS.BUTTON_QUOTA,
    description: HELP_TEXT.BUTTON_QUOTA,
    onPress,
});
