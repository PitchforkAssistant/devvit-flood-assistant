import {PostDelete} from "@devvit/protos";
import {TriggerContext} from "@devvit/public-api";
import {trackActionTime} from "../helpers/redisHelpers.js";

export async function onPostDelete (event: PostDelete, context: TriggerContext) {
    const deletedAt = event.deletedAt;
    if (!deletedAt) {
        console.error(`Missing deletedAt (${deletedAt}) in onPostDelete`);
        return;
    }

    await trackActionTime(context.redis, "delete", event.postId, deletedAt);
}
