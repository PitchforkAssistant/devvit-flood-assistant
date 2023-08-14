import {SettingsFormFieldValidatorEvent} from "@devvit/public-api";
import {ERRORS} from "../constants.js";
import {getTimezoneOffset} from "date-fns-tz";
import {getLocaleFromString, safeTimeformat} from "../helpers/dateHelpers.js";
import {enUS} from "date-fns/locale";

export async function validateQuotaAmount (event: SettingsFormFieldValidatorEvent<number>) {
    const value = Number(event?.value);
    if (isNaN(value)) {
        return ERRORS.QUOTA_AMOUNT_NAN;
    }
    if (value < 0) {
        return ERRORS.QUOTA_AMOUNT_NEGATIVE;
    }
    if (!Number.isInteger(value)) {
        return ERRORS.QUOTA_AMOUNT_NOT_INTEGER;
    }
}

export async function validateQuotaPeriod (event: SettingsFormFieldValidatorEvent<number>) {
    const value = Number(event?.value);
    if (isNaN(value)) {
        return ERRORS.QUOTA_PERIOD_NAN;
    }
    if (value < 0) {
        return ERRORS.QUOTA_PERIOD_NEGATIVE;
    }
}

export async function validateCustomDateTemplate (event: SettingsFormFieldValidatorEvent<string>) {
    if (!safeTimeformat(new Date(), event?.value?.toString() ?? "", "UTC", enUS)) {
        return ERRORS.INVALID_TIMEFORMAT;
    }
}

export async function validateCustomTimezone (event: SettingsFormFieldValidatorEvent<string>) {
    if (isNaN(getTimezoneOffset(event?.value?.toString() ?? ""))) {
        return ERRORS.INVALID_TIMEZONE;
    }
}

export async function validateCustomLocale (event: SettingsFormFieldValidatorEvent<string>) {
    if (!getLocaleFromString(event?.value?.toString() ?? "")) {
        return ERRORS.INVALID_LOCALE;
    }
}
