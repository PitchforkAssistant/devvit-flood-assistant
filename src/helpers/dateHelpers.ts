import {Locale} from "date-fns";
import {formatInTimeZone} from "date-fns-tz";
import * as locales from "date-fns/locale";

export function safeTimeformat (datetime: Date, timeformat: string, timezone: string, locale: Locale): string {
    try {
        return formatInTimeZone(datetime, timezone, timeformat, {locale});
    } catch (e) {
        return "";
    }
}

export function isValidDate (date: Date): boolean {
    return !isNaN(date.getTime());
}

export function getLocaleFromString (input: string): Locale | undefined {
    const processedInput = input.replace("_", "").replace("-", "").trim().toLowerCase();

    const locale = Object.keys(locales).find(key => key.toLowerCase() === processedInput);
    if (locale) {
        return locales[locale] as Locale;
    }
}

export function getTimeDeltaInSeconds (a: Date, b: Date): number {
    if (isValidDate(a) && isValidDate(b)) {
        return Math.abs(a.getTime() - b.getTime()) / 1000;
    }
    return Infinity;
}
