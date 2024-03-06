import {ZMember} from "@devvit/protos";
import {RedisClient} from "@devvit/public-api";

export type TrackedActionType = "remove" | "delete";

/**
 * Adds multiple posts to the Redis store for a given author.
 * @param {RedisClient} redis The Redis client.
 * @param authorId The author's ID.
 * @param {Record<string, Date>} posts The posts to add. The keys are the post IDs and the values are the creation Dates.
 */
export async function trackPosts (redis: RedisClient, authorId: string, posts: Record<string, Date>) {
    const postArray: ZMember[] = Object.entries(posts).map(([postId, createdAt]) => ({member: postId, score: createdAt.getTime()}));

    // Not sure what zAdd does if the array is empty, but it's probably best to avoid it.
    if (postArray.length === 0) {
        return;
    }

    await redis.hset("authors", {authorId: ""});
    await redis.zAdd(`posts:${authorId}`, ...postArray);
}

/**
 * Adds a post to the Redis store for a given author.
 * @param {RedisClient} redis The Redis client.
 * @param authorId The author's ID.
 * @param postId The post ID.
 * @param {Date} createdAt The creation Date.
 */
export async function trackPost (redis: RedisClient, authorId: string, postId: string, createdAt: Date) {
    await redis.hset("authors", {authorId: ""});
    await redis.zAdd(`posts:${authorId}`, {member: postId, score: createdAt.getTime()});
}

/**
 * Removes a post from the Redis store for a given author.
 * @param {RedisClient} redis The Redis client.
 * @param authorId The author's ID.
 * @param postId The post ID.
 */
export async function untrackPost (redis: RedisClient, authorId: string, postId: string) {
    try {
        await redis.zRem(`posts:${authorId}`, [postId]); // If the set ends up empty, it will be removed by clearOldPostsByAuthorRedis
    } catch (e) {
        // Don't throw an error if the set doesn't exist.
        if (!String(e).toLowerCase().includes("redis: nil")) {
            throw e;
        }
    }
}

/**
 * Gets all posts for a given author from the Redis store.
 * @param {RedisClient} redis The Redis client.
 * @param authorId The author's ID.
 * @returns {Record<string, Date>} A record of post IDs and their corresponding creation Dates.
 */
export async function getPostsByAuthor (redis: RedisClient, authorId: string): Promise<Record<string, Date>> {
    const posts = await redis.zRange(`posts:${authorId}`, 0, -1, {by: "lex"});
    return posts.reduce((acc: Record<string, Date>, post) => {
        acc[post.member] = new Date(post.score);
        return acc;
    }, {});
}

/**
 * Clears old posts for a given author from the Redis store.
 * @param {RedisClient} redis The Redis client.
 * @param authorId The author's ID.
 * @param {Date} oldestAllowed The oldest allowed creation Date, all posts created before this will be removed.
 */
export async function clearOldPostsByAuthor (redis: RedisClient, authorId: string, oldestAllowed: Date) {
    await redis.zRemRangeByScore(`posts:${authorId}`, -Infinity, oldestAllowed.getTime());

    const remainingPosts = await redis.zCard(`posts:${authorId}`);
    if (remainingPosts === 0) {
        await redis.del(`posts:${authorId}`);
        await redis.hdel("authors", [authorId]);
    }
}

/**
 * Store the removal action time for a given post in Redis.
 * @param {RedisClient} redis The Redis client.
 * @param postId The post ID.
 * @param {Date} actionedAt The removal action time.
 */
export async function trackActionTime (redis: RedisClient, action: TrackedActionType, postId: string, actionedAt: Date) {
    await redis.zAdd(`${action}:time`, {member: postId, score: actionedAt.getTime()});
}

/**
 * Remove the action time for a given post from Redis.
 * @param {RedisClient} redis The Redis client.
 * @param postId The post ID.
 */
export async function untrackActionTime (redis: RedisClient, action: TrackedActionType, postId: string) {
    await redis.zRem(`${action}:time`, [postId]);
}

/**
 * Get the removal action time for a given post from Redis.
 * @param {RedisClient} redis The Redis client.
 * @param postId The post ID.
 */
export async function getActionTime (redis: RedisClient, action: TrackedActionType, postId: string): Promise<Date | undefined> {
    try {
        const removalTime = await redis.zScore(`${action}:time`, postId);
        return removalTime ? new Date(removalTime) : undefined;
    } catch (e) {
        // Return undefined if the member or set doesn't exist.
        if (String(e).toLowerCase().includes("redis: nil")) {
            return undefined;
        } else {
            throw e;
        }
    }
}

/**
 * Clear old removal times from Redis.
 * @param {RedisClient} redis The Redis client.
 * @param {Date} oldestAllowed The oldest allowed removal action time, all removal times before this will be removed.
 */
export async function clearOldActionTimes (redis: RedisClient, oldestAllowed: Date) {
    await redis.zRemRangeByScore("remove:time", -Infinity, oldestAllowed.getTime());
    await redis.zRemRangeByScore("delete:time", -Infinity, oldestAllowed.getTime());
}
