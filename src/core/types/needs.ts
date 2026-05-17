import {RedisClient, SettingsClient} from "@devvit/public-api";

export type NeedsRedis = {
    redis: RedisClient;
}

export type NeedsSettings = {
    settings: SettingsClient;
}
