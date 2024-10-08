
import {Post, RedditAPIClient, RedisClient, Subreddit, User} from "@devvit/public-api";
import {FloodAssistantConfig} from "./appConfig.js";
import {isContributor, isModerator} from "devvit-helpers";
import {clearOldPosts, getActionTime, getPostsByAuthor} from "./helpers/redisHelpers.js";

export type QuotaExclusionReason = "age" | "currentPost" | "deleted" | "removed" | "autoRemoved" | "floodingRemoved";

export type QuotaIncludedResult =
    | { included: true }
    | { included: false; exclusionReason: QuotaExclusionReason };

export class FloodingEvaluator {
    public useCached = true;
    public readonly now: Date;
    public readonly cutoff: Date;
    private cachedIncludedPosts: Post[] | undefined;
    private appAccount: User | undefined;

    constructor (
        readonly config: FloodAssistantConfig,
        protected reddit: RedditAPIClient,
        protected redis: RedisClient,
        protected subreddit: Subreddit,
        protected author: User,
        protected currentPost?: Post
    ) {
        this.now = new Date();
        this.cutoff = new Date(this.now.getTime() - this.config.quotaPeriod * 60 * 60 * 1000);

        // If the current time is more than 5 minutes ahead of the post creation time, something might be wrong.
        if (this.currentPost && this.now.getTime() - this.currentPost.createdAt.getTime() > 5 * 60 * 1000) {
            console.warn(`Post ${this.currentPost.id} was created at ${this.currentPost.createdAt.toISOString()}, but the current time is ${this.now.toISOString()}! Is Devvit backlogged?`);
        }
    }

    public async isIgnoredUser (): Promise<boolean> {
        const inIgnoredGroupPromises: Promise<boolean>[] = [];

        if (this.config.ignoreModerators) {
            inIgnoredGroupPromises.push(isModerator(this.reddit, this.subreddit.name, this.author.username));
        }

        if (this.config.ignoreContributors) {
            inIgnoredGroupPromises.push(isContributor(this.reddit, this.subreddit.name, this.author.username));
        }

        const inIgnoredGroups = await Promise.all(inIgnoredGroupPromises);
        return inIgnoredGroups.some(Boolean);
    }

    public async getAppAccount (): Promise<User> {
        if (!this.appAccount || !this.useCached) {
            this.appAccount = await this.reddit.getAppUser();
        }
        return this.appAccount;
    }

    /**
     * Check is a post counts towards the quota.
     * @param {Post} post
     * @param {Date} createdAt
     * @returns {Promise<boolean>} True if the post counts towards the quota, false otherwise.
     */
    public async countsTowardQuota (post: Post): Promise<QuotaIncludedResult> {
        // The post currently being evaluated never counts towards the quota.
        if (this.currentPost && post.id === this.currentPost.id) {
            return {included: false, exclusionReason: "currentPost"};
        }

        // If the post is older than the cutoff, it doesn't count towards the quota.
        // This shouldn't happen, as we're clearing old posts from Redis in getIncludedPosts,
        // but just in case this function is called from elsewhere, we'll check for it.
        if (post.createdAt < this.cutoff) {
            return {included: false, exclusionReason: "age"};
        }

        // If we're not ignoring any types of removed posts, we don't need to perform any further checks.
        if (!this.config.ignoreDeleted && !this.config.ignoreRemoved && !this.config.ignoreAutoRemoved) {
            return {included: true};
        }

        // removedByCategory is only undefined if the post is up.
        if (!post.removedByCategory) {
            return {included: true};
        }

        // Skip any further checks if the post is removed (not deleted) and we're ignoring removed posts.
        if (post.removedByCategory && post.removedByCategory !== "deleted") {
            if (this.config.ignoreRemoved) {
                return {included: false, exclusionReason: "removed"};
            }
        }

        // Skip any further checks if the post was removed by this app.
        if (post.removedBy === (await this.getAppAccount()).username) {
            return {included: false, exclusionReason: "floodingRemoved"};
        }

        // If the post is deleted and we're ignoring deleted posts, we'll need to check if it was removed before being deleted.
        if (this.config.ignoreDeleted && post.removedByCategory === "deleted") {
            // We're ignoring removed posts too, so it doesn't matter if it was removed before being deleted.
            if (this.config.ignoreRemoved) {
                return {included: false, exclusionReason: "deleted"};
            }

            // Get the removal time for the post. If it doesn't exist, we can assume it wasn't deleted after being removed.
            const removeTime = await getActionTime(this.redis, "remove", post.id);
            if (!removeTime) {
                return {included: false, exclusionReason: "deleted"};
            }

            // Get the deletion time for the post.
            // If it doesn't exist, but the removal time does, it was probably removed before the app started tracking deletions.
            // That shouldn't happen though because it would also mean it was deleted before being created, which is impossible.
            // Regardless of how it might happen, it implies the post was deleted before being removed, so it counts under the ignoreDeleted setting.
            const deleteTime = await getActionTime(this.redis, "delete", post.id);
            if (!deleteTime) {
                return {included: false, exclusionReason: "deleted"};
            }

            // We can ignore it under the ignoreDeleted setting if it was deleted before being removed.
            if (removeTime > deleteTime) {
                return {included: false, exclusionReason: "deleted"};
            }
        }

        // We already know removedByCategory is not undefined.
        // We also know that if the post was deleted, it was not removed before being deleted.
        // ignoreRemoved also has to be false, or it would have returned already.
        if (this.config.ignoreAutoRemoved) {
            // Filtered posts might as well be auto-removed.
            if (post.removedByCategory === "automod_filtered") {
                return {included: false, exclusionReason: "autoRemoved"};
            }

            // If the post was removed by AutoModerator, that counts as an auto-removal.
            if (post.removedBy?.toLowerCase() === "automoderator") {
                return {included: false, exclusionReason: "autoRemoved"};
            }

            // If the post was removed within 60 seconds of being created, it was probably auto-removed.
            // Also if the removeTime doesn't exist here, it was probably removed by something that doesn't trigger onModAction.
            const removeTime = await getActionTime(this.redis, "remove", post.id);
            if (!removeTime) {
                console.warn(`Post ${post.id} has no removeTime, was it removed without triggering onModAction? Cause: ${post.removedByCategory}`);
            } else if (removeTime.getTime() - post.createdAt.getTime() < 60 * 1000) {
                return {included: false, exclusionReason: "autoRemoved"};
            }
        }

        // At this point we know it doesn't fall under any of the ignore settings, so it must count towards the quota.
        return {included: true};
    }

    /**
     * Get a sorted list of past posts that count towards the quota for the author of the current post.
     * @param useCached Should we use the cached included posts if they exist?
     * @returns {Promise<Post[]>} List of posts that count towards the quota, sorted by creation date.
     */
    public async getIncludedPosts (): Promise<Post[]> {
        if (this.useCached && this.cachedIncludedPosts) {
            return this.cachedIncludedPosts;
        }

        // Clear old posts from Redis
        await clearOldPosts(this.redis, this.cutoff);

        const trackedPosts = await getPostsByAuthor(this.redis, this.author.id);

        console.log(`Posts tracked for ${this.author.username}: ${Object.keys(trackedPosts).join(", ")}`);

        // We want to get and check all the included posts in parallel.
        // We'll add a promise to fetch every tracked post, once it's fetched we'll only return the post if it counts towards the quota.
        const includedPostPromises: Promise<Post|undefined>[] = [];
        for (const postId of Object.keys(trackedPosts)) {
            includedPostPromises.push(this.reddit.getPostById(postId).then(async post => (await this.countsTowardQuota(post)).included ? post : undefined));
        }
        // Posts that weren't included returned undefined, so we'll filter those out.
        const includedPosts = (await Promise.all(includedPostPromises)).filter(Boolean) as Post[];

        // sort post from newest to oldest
        includedPosts.sort((postA, postB) => postB.createdAt.getTime() - postA.createdAt.getTime());

        console.log(`Posts included in quota for ${this.author.username}: ${includedPosts.map(post => post.id).join(", ")}`);

        this.cachedIncludedPosts = includedPosts;
        return includedPosts;
    }

    /**
     * Check if the current post would exceed the quota.
     * @returns {Promise<boolean>} True if the current post would exceeded the quota, false otherwise.
     */
    public async exceedsQuota (): Promise<boolean> {
        const includedPosts = await this.getIncludedPosts();
        return includedPosts.length >= this.config.quotaAmount;
    }

    /**
     * Get the next allowed post time for the current author.
     * @returns {Promise<Date>} The next allowed post time for the current author.
     */
    public async getNextPostOpportunity (): Promise<Date> {
        if (!await this.exceedsQuota()) {
            return this.now;
        }

        const includedPosts = await this.getIncludedPosts();
        if (includedPosts.length < this.config.quotaAmount || includedPosts.length < 1) {
            console.warn(`The posts list for ${this.author.username} is ${includedPosts.length} long, but somehow exceeds quota of ${this.config.quotaAmount}??`);
            return this.now;
        }

        /* Calculate the index of the first post that will create a free spot in the list of posts that count towards the quota.

           Example 1: List of posts is longer than the quota amount.
            If there are 2 posts allowed and the list of included posts has 5, 4 posts will need to move out of the quota to make room for a new post.
            length = 5
            quotaAmount = 3
            freeSpotIndex = 0 + quotaAmount - 1 = 2 (3rd newest post in the list of 5, so once it expires, the list will be down to 2)

           Example 2: List of posts is equal to the quota amount.
            If there are 2 posts allowed and the list of included posts has 2, 1 posts will need to move out of the quota to make room for a new post.
            length = 2
            quotaAmount = 2
            freeSpotIndex = 0 + quotaAmount - 1 = 1 (2nd newest post in the list of 2, so once it expires, the list will be down to 1)

           Example 3: List of posts is shorter than the quota amount.
            If there are 2 posts allowed and the list of included posts has 1, 0 posts will need to move out of the quota to make room for a new post.
            length = 1
            quotaAmount = 2
            freeSpotIndex = 0 + quotaAmount - 1 = 1 (we'll return the current time, as the list is already below the quota amount)
            This shouldn't happen, but we'll need to check for negative numbers just in case.
        */
        const freeSpotIndex = this.config.quotaAmount - 1;

        if (freeSpotIndex < 0 || freeSpotIndex >= includedPosts.length) {
            return this.now;
        } else {
            return new Date(includedPosts[freeSpotIndex].createdAt.getTime() + this.config.quotaPeriod * 60 * 60 * 1000);
        }
    }

    public async getOldestIncludedPost (): Promise<Post | undefined> {
        const includedPosts = await this.getIncludedPosts();
        return includedPosts.slice(-1)[0];
    }

    public async getNewestIncludedPost (): Promise<Post | undefined> {
        const includedPosts = await this.getIncludedPosts();
        return includedPosts[0];
    }
}

