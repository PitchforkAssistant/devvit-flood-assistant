import {PostSubmit} from "@devvit/protos";
import {TriggerContext} from "@devvit/public-api";
import {trackPost} from "../helpers/redisHelpers.js";

export async function onPostSubmit (event: PostSubmit, context: TriggerContext) {
    console.log(`running onPostSubmit for ${event.post?.id ?? ""}`);

    const authorId = event.author?.id;
    const postId = event.post?.id;
    const createdAt = event.post?.createdAt;
    if (!authorId || !postId || !createdAt) {
        throw new Error(`Missing authorId (${authorId ?? ""}), postId (${postId ?? ""}), or createdAt (${createdAt ?? ""}) in onPostSubmit`);
    }

    await trackPost(context.redis, authorId, postId, new Date(createdAt)).catch(e => console.error(`addPostToRedis failed in onPostSubmit for ${postId}`, e));
}
