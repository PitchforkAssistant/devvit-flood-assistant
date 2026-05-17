import {isValidDate, zScanAll} from "devvit-helpers";
import {NeedsRedis} from "../types/needs.js";
import {isLinkId} from "@devvit/public-api/types/tid.js";

export const TRACKED_POSTS_KEY = "posts";

/**
 * Get a member key for a post tracked by an author.
 * @param authorId The author's ID.
 * @param postId The post ID or a wildcard.
 * @returns The formatted member key.
 */
export const formatAuthorPostMember = (authorId: string, postId: string) => `${authorId}:${postId}`;

export type IsTrackedPostOptions = NeedsRedis & {
    authorId: string;
    postId: string;
}

export type AddTrackedPostOptions = NeedsRedis & {
    authorId: string;
    postId: string;
    createdAt?: Date;
}

export type RemTrackedPostOptions = NeedsRedis & {
    authorId: string;
    postId: string;
}

export type GetTrackedPostsByAuthorOptions = NeedsRedis & {
    authorId: string;
}

/**
 * Options for purging old tracked posts.
 * @param {RedisClient} options.redis The Redis client.
 * @param {string} options.authorId The author's ID.
 * @param {Date} options.oldestAllowed The oldest allowed date.
 */
export type PurgeOldTrackedPostsOptions = NeedsRedis & {
    oldestAllowed: Date;
}

/**
 * Checks whether a given post is being tracked in the Redis store for a given author.
 * @param {IsTrackedPostOptions} options The options for checking if a post is tracked.
 * @param {RedisClient} options.redis The Redis client.
 * @param {string} options.authorId The author's ID.
 * @param {string} options.postId The post ID.
 * @return {boolean} Whether the post is being tracked.
 */
export async function isTrackedPost ({redis, authorId, postId}: IsTrackedPostOptions): Promise<boolean> {
    try {
        const score = await redis.zScore(TRACKED_POSTS_KEY, formatAuthorPostMember(authorId, postId));
        return typeof score === "number"; // zScore returns null if the member doesn't exist, so we convert it to a boolean.
    } catch (e) {
        // Return false if the member or set doesn't exist.
        if (String(e).toLowerCase().includes("redis: nil")) {
            return false;
        }
        throw e;
    }
}

/**
 * Adds a post to the Redis store for a given author.
 * @param {AddTrackedPostOptions} options The options for adding a tracked post.
 * @param {RedisClient} options.redis The Redis client.
 * @param {string} options.authorId The author's ID.
 * @param {string} options.postId The post ID.
 * @param {Date} options.createdAt The creation Date.
 */
export async function addTrackedPost ({redis, authorId, postId, createdAt}: AddTrackedPostOptions) {
    if (!createdAt || !isValidDate(createdAt)) {
        console.warn(`Missing or invalid createdAt for post ${postId} by author ${authorId} (falling back to now): `, createdAt);
        createdAt = new Date();
    }
    await redis.zAdd(TRACKED_POSTS_KEY, {member: formatAuthorPostMember(authorId, postId), score: createdAt.getTime()});
}

/**
 * Removes a post from the Redis store for a given author.
 * @param {RemTrackedPostOptions} options The options for removing a tracked post.
 * @param {RedisClient} options.redis The Redis client.
 * @param {string} options.authorId The author's ID.
 * @param {string} options.postId The post ID.
 */
export async function remTrackedPost ({redis, authorId, postId}: RemTrackedPostOptions) {
    try {
        await redis.zRem(TRACKED_POSTS_KEY, [formatAuthorPostMember(authorId, postId)]); // If the set ends up empty, it will be removed by clearOldPostsByAuthorRedis
    } catch (e) {
        // Don't throw an error if the set doesn't exist.
        if (!String(e).toLowerCase().includes("redis: nil")) {
            throw e;
        }
    }
}

/**
 * Gets all posts for a given author from the Redis store.
 * @param {GetTrackedPostsByAuthorOptions} options The options for getting tracked posts by author.
 * @param {RedisClient} options.redis The Redis client.
 * @param {string} options.authorId The author's ID.
 * @returns {Record<string, Date>} A record of post IDs and their corresponding creation Dates.
 */
export async function getTrackedPostsByAuthor ({redis, authorId}: GetTrackedPostsByAuthorOptions): Promise<Record<string, Date>> {
    const storedPosts = await zScanAll(redis, TRACKED_POSTS_KEY, formatAuthorPostMember(authorId, "*"));
    const posts: Record<string, Date> = {};
    storedPosts.forEach(post => {
        const [, postId] = post.member.split(":");
        if (isLinkId(postId)) {
            posts[postId] = new Date(post.score);
        }
    });
    return posts;
}

/**
 * Clears old posts for a given author from the Redis store.
 * @param {PurgeOldTrackedPostsOptions} options The options for purging old tracked posts.
 * @param {RedisClient} options.redis The Redis client.
 * @param {Date} options.oldestAllowed The oldest allowed creation Date, all posts created before this will be removed.
 */
export async function purgeOldTrackedPosts ({redis, oldestAllowed}: PurgeOldTrackedPostsOptions) {
    await redis.zRemRangeByScore(TRACKED_POSTS_KEY, -Infinity, oldestAllowed.getTime());
}
