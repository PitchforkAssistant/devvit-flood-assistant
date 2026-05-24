import {PostSubmit} from "@devvit/protos";
import {TriggerContext} from "@devvit/public-api";
import {addTrackedPost} from "../core/redis/trackedPosts.js";

export async function onPostSubmit (event: PostSubmit, context: TriggerContext) {
    console.log(`running onPostSubmit for ${event.post?.id} by ${event.author?.id}`);

    const authorId = event.author?.id;
    const postId = event.post?.id;
    if (!authorId || !postId || authorId === "t2_0" || postId === "t3_0") {
        throw new Error(`Missing authorId (${authorId}) or postId (${postId}) in onPostSubmit`);
    }

    await addTrackedPost({
        redis: context.redis,
        authorId,
        postId,
        createdAt: event.post?.createdAt ? new Date(event.post.createdAt) : undefined,
    });
}
