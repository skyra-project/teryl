import { isNullish, isNullishOrEmpty } from '@sapphire/utilities';
import type { LocaleString } from 'discord-api-types/v10';
import { DateTime } from 'luxon';

const YYYY_MM_DD = /\b(?<year>\d{4})([/\-\.])(?<month>\d{1,2})\2(?<day>\d{1,2})\b/d;
const DD_MM_YYYY = /\b(?<day>\d{1,2})([/\-\.])(?<month>\d{1,2})(?:\2(?<year>\d{2,4}))?\b/d;
const MM_DD_YYYY = /\b(?<month>\d{1,2})([/\-\.])(?<day>\d{1,2})(?:\2(?<year>\d{2,4}))?\b/d;
const TimeOnly = /^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?(?:\s*(am|pm))?$/i;

export class DateParser {
	public year: number | null = null;
	public month: number | null = null;
	public day: number | null = null;
	public hour: number | null = null;
	public minute: number | null = null;
	public second: number | null = null;
	public valid: boolean;

	public constructor(input: string, locale: LocaleString) {
		const date = YYYY_MM_DD.exec(input) ?? (locale === 'en-US' ? MM_DD_YYYY : DD_MM_YYYY).exec(input);
		this.valid = this.normalizeDate(date);

		const remainder = date ? (date.index === 0 ? input.slice(date[0].length) : input.slice(0, date.index)).trim() : input;
		if (remainder.length) {
			const time = TimeOnly.exec(remainder);
			this.valid = this.normalizeTime(time);
		}

		this.valid ??= false;
	}

	public normalize(tz?: string) {
		const now = DateTime.now().setZone(tz);
		const date = now.set({
			year: this.year ?? undefined,
			month: this.month ?? undefined,
			day: this.day ?? undefined,
			hour: this.hour ?? 0,
			minute: this.minute ?? 0,
			second: this.second ?? 0
		});

		const difference = date.diff(now);
		if (difference.toMillis() >= 0) return difference;

		// If the difference goes positive after adding only 1 day, and none was defined, schedule for next day:
		if (isNullish(this.day)) {
			const { days } = difference.shiftTo('days');
			if (days > -1) return difference.plus({ days: 1 });
		}

		// If the difference goes positive after adding only 1 month, and none was defined, schedule for next month:
		if (isNullish(this.month)) {
			const { months } = difference.shiftTo('months');
			if (months > -1) return difference.plus({ months: 1 });
		}

		// If the difference goes positive after adding only 1 year, and none was defined, schedule for next year:
		if (isNullish(this.year)) {
			const { years } = difference.shiftTo('years');
			if (years > -1) return difference.plus({ years: 1 });
		}

		return difference;
	}

	private normalizeDate(results: RegExpExecArray | null) {
		if (results === null) return false;

		// Set the year, add 2000 if the length is different from 4 (e.g. 23 → 2023):
		this.year = isNullishOrEmpty(results.groups!.year) ? null : Number(results.groups!.year) + (results.groups!.year.length < 4 ? 2000 : 0);

		// Set the month and day, if it detects the units are swapped (for some reason), invert:
		const month = Number(results.groups!.month);
		const day = Number(results.groups!.day);
		this.month = month > 12 ? day : month;
		this.day = month > 12 ? month : day;
		return true;
	}

	private normalizeTime(results: RegExpExecArray | null) {
		if (results === null) return false;

		const modifier = results[4] as 'am' | 'pm' | undefined;
		this.hour = Number(results[1]);
		if (!isNullishOrEmpty(modifier)) {
			// If the modifier is AM, trim down (8am/20am → 8:00):
			if (modifier === 'am') this.hour %= 12;
			// If the modifier is PM, increase only if it's not PM already (8pm/20pm → 20:00):
			else if (this.hour < 12) this.hour += 12;
		}

		this.minute = isNullishOrEmpty(results[2]) ? 0 : Number(results[2]);
		this.second = isNullishOrEmpty(results[3]) ? 0 : Number(results[3]);
		return true;
	}
}
