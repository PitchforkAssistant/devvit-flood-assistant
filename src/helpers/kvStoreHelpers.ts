import {KVStore} from "@devvit/public-api";
import {JSONObject} from "@devvit/shared-types/json.js";

export async function addPostToKvStore (kvStore: KVStore, authorId: string, postId: string, createdAt: number) {
    let currentValue = await kvStore.get<JSONObject>(authorId);
    if (!currentValue) {
        currentValue = {};
    }

    if (!currentValue[postId]) {
        currentValue[postId] = createdAt;
        await kvStore.put(authorId, currentValue);
    } else {
        console.error(`Post ${postId} already exists in kv store for user ${authorId}`);
    }
}

export async function removePostFromKvStore (kvStore: KVStore, authorId: string, postId: string) {
    const currentValue = await kvStore.get<JSONObject>(authorId);
    if (!currentValue) {
        return;
    }

    if (postId in currentValue) {
        Reflect.deleteProperty(currentValue, postId);
        await kvStore.put(authorId, currentValue);
    }
}

export async function getPostsByAuthor (kvStore: KVStore, authorId: string): Promise<Record<string, number>> {
    const posts = await kvStore.get<Record<string, number>>(authorId);
    return posts ?? {};
}

export async function clearOldPostsByAuthor (kvStore: KVStore, authorId: string, maxAgeHours: number): Promise<Record<string, number>> {
    console.log(`clearOldPostsByAuthor for user ${authorId}`);

    const posts = await getPostsByAuthor(kvStore, authorId);
    console.log(`old value for ${authorId}: ${JSON.stringify(posts)}`);

    const maxAge = Date.now() - maxAgeHours * 60 * 60 * 1000;
    const newPosts: Record<string, number> = {};
    for (const [postId, postAge] of Object.entries(posts)) {
        if (postAge >= maxAge) {
            newPosts[postId] = postAge;
        }
    }

    console.log(`new value for ${authorId}: ${JSON.stringify(newPosts)}`);
    if (Object.keys(newPosts).length === 0) {
        console.log(`no posts remaining for ${authorId}, deleting key`);
        await kvStore.delete(authorId);
    } else if (Object.keys(newPosts).length === Object.keys(posts).length) {
        console.log(`no changes to ${authorId}`);
    } else {
        console.log(`removing ${Object.keys(posts).length - Object.keys(newPosts).length} stored posts from ${authorId}`);
        await kvStore.put(authorId, newPosts);
    }

    return newPosts;
}
