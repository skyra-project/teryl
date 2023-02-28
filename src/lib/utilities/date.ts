import { isNullish, isNullishOrEmpty } from '@sapphire/utilities';
import type { LocaleString } from 'discord-api-types/v10';
import { DateTime } from 'luxon';

const YYYY_MM_DD = /(?<year>\d{4})([/\-.])(?<month>\d{1,2})\2(?<day>\d{1,2})/d;
const DD_MM_YYYY = /(?<day>\d{1,2})([/\-.])(?<month>\d{1,2})(?:\2(?<year>\d{2,4}))?/d;
const MM_DD_YYYY = /(?<month>\d{1,2})([/\-.])(?<day>\d{1,2})(?:\2(?<year>\d{2,4}))?/d;
const TimeOnly = /^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?(?:\s*(am|pm))?$/i;

export class DateParser {
	public year: number | null = null;
	public month: number | null = null;
	public day: number | null = null;
	public hour: number | null = null;
	public minute: number | null = null;
	public second: number | null = null;
	public modifier: 'am' | 'pm' | null = null;
	public valid: boolean;

	public constructor(input: string, locale: LocaleString) {
		const date = YYYY_MM_DD.exec(input) ?? (locale === 'en-US' ? MM_DD_YYYY : DD_MM_YYYY).exec(input);
		this.normalizeDate(date);

		const remainder = date ? (date.index === 0 ? input.slice(date[0].length) : input.slice(0, date.index)).trim() : input;
		const time = TimeOnly.exec(remainder);
		this.normalizeTime(time);
		this.valid = !isNullish(date) || !isNullish(time);
	}

	public normalize(tz?: string) {
		const now = DateTime.now().setZone(tz);
		const date = now.set({
			year: this.year ?? undefined,
			month: this.month ?? undefined,
			day: this.day ?? undefined,
			hour: this.hour && this.modifier ? (this.hour + (this.modifier === 'pm' ? 12 : 0)) % 24 : this.hour ?? 0,
			minute: this.minute ?? 0,
			second: this.second ?? 0
		});

		let difference = date.diff(now);
		if (difference.toMillis() >= 0) return difference;

		if (isNullish(this.day)) {
			const { days } = difference.shiftTo('days');
			if (days > -1) {
				difference = difference.plus({ days: 1 });
				if (difference.toMillis() >= 0) return difference;
			}
		}

		if (isNullish(this.month)) {
			const { months } = difference.shiftTo('months');
			if (months > -1) {
				difference = difference.plus({ months: 1 });
				if (difference.toMillis() >= 0) return difference;
			}
		}

		if (isNullish(this.year)) {
			const { years } = difference.shiftTo('years');
			if (years > -1) return difference.plus({ years: 1 });
		}

		return difference;
	}

	private normalizeDate(results: RegExpExecArray | null) {
		if (results === null) return;

		this.year = isNullishOrEmpty(results.groups!.year) ? null : Number(results.groups!.year);
		const month = Number(results.groups!.month);
		const day = Number(results.groups!.day);
		this.month = month > 12 ? day : month;
		this.day = month > 12 ? month : day;
	}

	private normalizeTime(results: RegExpExecArray | null) {
		if (results === null) return;

		this.hour = Number(results[1]);
		this.minute = isNullishOrEmpty(results[2]) ? null : Number(results[2]);
		this.second = isNullishOrEmpty(results[3]) ? null : Number(results[3]);
		this.modifier = isNullishOrEmpty(results[4]) ? null : (results[4] as 'am' | 'pm');
	}
}
