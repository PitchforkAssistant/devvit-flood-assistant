import {RedisClient} from "@devvit/public-api";
import {isT3ID} from "@devvit/shared-types/tid.js";
import {zScanAll} from "devvit-helpers";

export type TrackedActionType = "remove" | "delete";

/**
 * Adds a post to the Redis store for a given author.
 * @param {RedisClient} redis The Redis client.
 * @param authorId The author's ID.
 * @param postId The post ID.
 * @param {Date} createdAt The creation Date.
 */
export async function trackPost (redis: RedisClient, authorId: string, postId: string, createdAt: Date) {
    await redis.zAdd("posts", {member: `${authorId}:${postId}`, score: createdAt.getTime()});
}

/**
 * Removes a post from the Redis store for a given author.
 * @param {RedisClient} redis The Redis client.
 * @param authorId The author's ID.
 * @param postId The post ID.
 */
export async function untrackPost (redis: RedisClient, authorId: string, postId: string) {
    try {
        await redis.zRem("posts", [`${authorId}:${postId}`]); // If the set ends up empty, it will be removed by clearOldPostsByAuthorRedis
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
    const storedPosts = await zScanAll(redis, "posts", `${authorId}:*`);
    const posts: Record<string, Date> = {};
    storedPosts.forEach(post => {
        const [, postId] = post.member.split(":");
        if (isT3ID(postId)) {
            posts[postId] = new Date(post.score);
        }
    });
    return posts;
}

/**
 * Clears old posts for a given author from the Redis store.
 * @param {RedisClient} redis The Redis client.
 * @param authorId The author's ID.
 * @param {Date} oldestAllowed The oldest allowed creation Date, all posts created before this will be removed.
 */
export async function clearOldPosts (redis: RedisClient, oldestAllowed: Date) {
    await redis.zRemRangeByScore("posts", -Infinity, oldestAllowed.getTime());
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
