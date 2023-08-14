import {ModActionType, RedditAPIClient} from "@devvit/public-api";
import {logError} from "./miscHelpers.js";
import {getTimeDeltaInSeconds} from "./dateHelpers.js";

export async function hasPerformedAction (reddit: RedditAPIClient, subredditName: string, actionTargetId: string, actionType: ModActionType, cutoffSeconds?: number, includeParent?: boolean, moderatorName?: string): Promise<boolean> {
    const modLog = await reddit.getModerationLog({subredditName, moderatorId: moderatorName, type: actionType, limit: 100, pageSize: 100}).all().catch(e => {
        logError(`Failed to fetch ${actionType} log for ${subredditName} by ${moderatorName ?? ""}`, e);
        return [];
    });
    for (const modAction of modLog) {
        if (!cutoffSeconds || getTimeDeltaInSeconds(new Date(), modAction.createdAt) < cutoffSeconds) {
            if (modAction.target?.id === actionTargetId) {
                return true;
            } else if (includeParent && modAction.target?.permalink?.startsWith(`/r/${subredditName}/comments/${actionTargetId.substring(3)}/`)) {
                return true;
            }
        }
    }
    return false;
}

export async function hasPerformedActions (reddit: RedditAPIClient, subredditName: string, actionTargetId: string, actionTypes: ModActionType[], cutoffSeconds?: number, includeParent?: boolean, moderatorName?: string): Promise<boolean> {
    const actionChecks = actionTypes.map(actionType => hasPerformedAction(reddit, subredditName, actionTargetId, actionType, cutoffSeconds, includeParent, moderatorName));
    const results = await Promise.all(actionChecks);
    return results.includes(true);
}

export async function isModerator (reddit: RedditAPIClient, subredditName: string, username: string): Promise<boolean> {
    const filteredModeratorList = await reddit.getModerators({subredditName, username}).all();
    return filteredModeratorList.length > 0;
}

export async function isContributor (reddit: RedditAPIClient, subredditName: string, username: string): Promise<boolean> {
    const filteredContributorList = await reddit.getApprovedUsers({subredditName, username}).all();
    return filteredContributorList.length > 0;
}
