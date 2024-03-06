import {EventSource, PostDelete} from "@devvit/protos";
import {TriggerContext} from "@devvit/public-api";
import {trackActionTime} from "../helpers/redisHelpers.js";

export async function onPostDelete (event: PostDelete, context: TriggerContext) {
    // The PostDelete event name is a bit misleading,
    // it actually fires both when a post is deleted by the user and when it's removed (not deleted) by a mod or admin.
    if (event.source !== EventSource.USER) {
        return;
    }

    console.log(`processing user deletion of ${event.postId}`);
    const deletedAt = event.deletedAt;
    if (!deletedAt) {
        console.error(`Missing deletedAt (${deletedAt}) in onPostDelete`);
        return;
    }

    await trackActionTime(context.redis, "delete", event.postId, deletedAt);
}
