/**
 * Convert hours to milliseconds
 * @param hours number of hours
 * @returns number of milliseconds in the given number of hours
 */
export function hoursToMillis (hours: number): number {
    return hours * 60 * 60 * 1000;
}

/**
 * Convert minutes to milliseconds
 * @param minutes number of minutes
 * @returns number of milliseconds in the given number of minutes
 */
export function minutesToMillis (minutes: number): number {
    return minutes * 60 * 1000;
}

/**
 * Convert seconds to milliseconds
 * @param seconds number of seconds
 * @returns number of milliseconds in the given number of seconds
 */
export function secondsToMillis (seconds: number): number {
    return seconds * 1000;
}

/**
 * Convert milliseconds to seconds
 * @param millis number of milliseconds
 * @returns number of seconds
 */
export function millisToSeconds (millis: number): number {
    return millis / 1000;
}
