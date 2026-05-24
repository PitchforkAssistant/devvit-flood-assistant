import {hoursToMillis, minutesToMillis, secondsToMillis} from "../src/core/utils/time.js";

test("converts hours to milliseconds", () => {
    expect(hoursToMillis(1)).toBe(60 * 60 * 1000);
    expect(hoursToMillis(2.5)).toBe(2.5 * 60 * 60 * 1000);
    expect(hoursToMillis(-1)).toBe(-60 * 60 * 1000);
    expect(hoursToMillis(0)).toBe(0);
});

test("converts minutes to milliseconds", () => {
    expect(minutesToMillis(1)).toBe(60 * 1000);
    expect(minutesToMillis(3.75)).toBe(3.75 * 60 * 1000);
    expect(minutesToMillis(-2)).toBe(-2 * 60 * 1000);
    expect(minutesToMillis(0)).toBe(0);
});

test("converts seconds to milliseconds", () => {
    expect(secondsToMillis(1)).toBe(1000);
    expect(secondsToMillis(3.75)).toBe(3.75 * 1000);
    expect(secondsToMillis(-2)).toBe(-2 * 1000);
    expect(secondsToMillis(0)).toBe(0);
});

test("converts milliseconds to seconds", () => {
    expect(secondsToMillis(1)).toBe(1000);
    expect(secondsToMillis(3.75)).toBe(3.75 * 1000);
    expect(secondsToMillis(-2)).toBe(-2 * 1000);
    expect(secondsToMillis(0)).toBe(0);
});
