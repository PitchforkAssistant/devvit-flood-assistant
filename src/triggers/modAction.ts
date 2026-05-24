import {ModAction} from "@devvit/protos";
import {TriggerContext} from "@devvit/public-api";
import {trackAction} from "../core/trackAction.js";

export async function onModAction (event: ModAction, {redis, settings}: TriggerContext) {
    // We're only interested in link removals
    if (event.action !== "removelink" && event.action !== "spamlink" && event.action !== "approvelink") {
        return;
    }
    console.log(`processing ${event.action} for ${event.targetPost?.id}`);

    const postId = event.targetPost?.id;
    if (!postId || postId === "t3_0") {
        console.error(`Missing postId (${postId}) in onModAction`);
        return;
    }

    console.log(`tracking ${event.action} for ${postId}`);
    if (event.action === "approvelink") {
        await trackAction({redis, settings, postId, action: "approve", actionedAt: event.actionedAt, createdAt: new Date(event.targetPost?.createdAt ?? NaN)});
    } else {
        await trackAction({redis, settings, postId, action: "remove", actionedAt: event.actionedAt, createdAt: new Date(event.targetPost?.createdAt ?? NaN)});
    }
}
