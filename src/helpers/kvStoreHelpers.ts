import {KVStore} from "@devvit/public-api";

export async function addPostToKvStore (kvStore: KVStore, authorId: string, postId: string, createdAt: number) {
    let currentValue = await kvStore.get(authorId);
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

export async function getPostsByAuthor (kvStore: KVStore, authorId: string): Promise<Record<string, number>> {
    const posts = await kvStore.get<Record<string, number>>(authorId);
    return posts ?? {};
}

export async function clearOldPostsByAuthor (kvStore: KVStore, authorId: string, maxAgeHours: number) {
    console.log(`clearOldPostsByAuthor for user ${authorId}`);
    const posts = await getPostsByAuthor(kvStore, authorId);
    console.log(`old value for ${authorId}: ${JSON.stringify(posts)}`);
    const maxAge = Date.now() - maxAgeHours * 60 * 60 * 1000;
    for (const post in posts) {
        if (posts[post] < maxAge) {
            delete posts[post];
        }
    }
    console.log(`new value for ${authorId}: ${JSON.stringify(posts)}`);
    await kvStore.put(authorId, posts);
}
