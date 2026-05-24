import {PostDelete, EventSource} from "@devvit/protos";
import {TriggerContext} from "@devvit/public-api";
import {trackAction} from "../core/trackAction.js";

export async function onPostDelete (event: PostDelete, {redis, settings}: TriggerContext) {
    console.log(`running onPostDelete for ${event.postId} by ${event.author?.id} with source ${event.source} and reason ${event.reason}`);

    console.log(`processing user deletion of ${event.postId} by ${event.author?.id}`);
    const deletedAt = event.deletedAt;
    const createdAt = event.createdAt;
    if (!deletedAt || !createdAt) {
        console.warn(`Missing deletedAt (${deletedAt?.toString()}) or createdAt (${createdAt?.toString()}) in onPostDelete for post ${event.postId} by ${event.author?.id}`);
    }

    // The PostDelete event name is a bit misleading,
    // it actually fires both when a post is deleted by the user and when it's removed (not deleted) by a mod or admin.
    if (event.source === EventSource.USER) {
        console.log(`Tracking user deletion of ${event.postId}`);
        await trackAction({redis, settings, postId: event.postId, action: "delete", actionedAt: deletedAt, createdAt});
    } else {
        console.log(`Tracking removal of ${event.postId} with source ${event.source} and reason ${event.reason}`);
        await trackAction({redis, settings, postId: event.postId, action: "remove", actionedAt: deletedAt, createdAt});
    }
}
