import {NeedsRedis} from "../types/needs.js";

export type TrackedActionType = "remove" | "delete";

export type AddTrackedActionTimeOptions = NeedsRedis & {
    action: TrackedActionType;
    postId: string;
    actionedAt: Date;
}

export type RemTrackedActionTimeOptions = NeedsRedis & {
    action: TrackedActionType;
    postId: string;
}

export type GetTrackedActionTimeOptions = NeedsRedis & {
    action: TrackedActionType;
    postId: string;
}

export type PurgeOldTrackedPostsOptions = NeedsRedis & {
    oldestAllowed: Date;
}

/**
 * Get a member key for a post tracked by an author.
 * @param action The action type.
 * @returns The formatted member key.
 */
export const formatActionTimeKey = (action: TrackedActionType) => `${action}:time`;

/**
 * Store the removal action time for a given post in Redis.
 * @param {AddTrackedActionTimeOptions} options The options for adding a tracked action time.
 * @param {RedisClient} options.redis The Redis client.
 * @param {string} options.postId The post ID.
 * @param {Date} options.actionedAt The removal action time.
 */
export async function addTrackedActionTime ({redis, action, postId, actionedAt}: AddTrackedActionTimeOptions) {
    await redis.zAdd(formatActionTimeKey(action), {member: postId, score: actionedAt.getTime()});
}

/**
 * Remove the action time for a given post from Redis.
 * @param {RemTrackedActionTimeOptions} options The options for removing a tracked action time.
 * @param {RedisClient} options.redis The Redis client.
 * @param {string} options.postId The post ID.
 */
export async function remTrackedActionTime ({redis, action, postId}: RemTrackedActionTimeOptions) {
    await redis.zRem(formatActionTimeKey(action), [postId]);
}

/**
 * Get the removal action time for a given post from Redis.
 * @param {GetTrackedActionTimeOptions} options The options for getting a tracked action time.
 * @param {RedisClient} options.redis The Redis client.
 * @param {string} options.postId The post ID.
 */
export async function getTrackedActionTime ({redis, action, postId}: GetTrackedActionTimeOptions): Promise<Date | undefined> {
    try {
        const removalTime = await redis.zScore(formatActionTimeKey(action), postId);
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
 * @param {PurgeOldTrackedPostsOptions} options The options for purging old tracked actions.
 * @param {RedisClient} options.redis The Redis client.
 * @param {Date} options.oldestAllowed The oldest allowed removal action time, all removal times before this will be removed.
 */
export async function purgeOldTrackedActions ({redis, oldestAllowed}: PurgeOldTrackedPostsOptions) {
    await redis.zRemRangeByScore(formatActionTimeKey("remove"), -Infinity, oldestAllowed.getTime());
    await redis.zRemRangeByScore(formatActionTimeKey("delete"), -Infinity, oldestAllowed.getTime());
}
