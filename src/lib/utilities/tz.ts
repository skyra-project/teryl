import { PathSrc } from '#lib/common/constants';
import { cut } from '#lib/common/strings';
import { toTitleCase } from '@sapphire/utilities';
import { readFile } from 'node:fs/promises';

const tz = new Map<string, TimeZone>();

export let MinimumLength = 100;
export const MaximumLength = 100;

{
	const tzCountries = new Map<string, TimeZoneCountry>();

	const PathTimeZoneCountry = new URL('./generated/data/tz-country-codes.json', PathSrc);
	for (const entry of JSON.parse(await readFile(PathTimeZoneCountry, 'utf8')) as TimeZoneCountry[]) {
		tzCountries.set(entry.code, {
			code: entry.code.toLowerCase(),
			name: entry.name.toLowerCase()
		});
	}

	const PathTimeZone = new URL('./generated/data/tz.json', PathSrc);
	for (const entry of JSON.parse(await readFile(PathTimeZone, 'utf8')) as RawTimeZone[]) {
		const countries = entry.codes.map((code) => tzCountries.get(code)!);
		tz.set(entry.name.toLowerCase(), {
			name: entry.name,
			countries,
			full: cut(`${entry.name} (${countries.map((country) => toTitleCase(country.name)).join(', ')})`, MaximumLength)
		});

		if (entry.name.length < MinimumLength) MinimumLength = entry.name.length;
	}
}

export function getTimeZone(id: string) {
	return tz.get(id.toLowerCase()) ?? null;
}

export function searchTimeZone(id: string) {
	if (id.length > MaximumLength) return [];

	id = id.toLowerCase();
	const entries = [] as TimeZone[];
	for (const [key, value] of tz.entries()) {
		if (!(key.includes(id) || value.countries.some((country) => country.code === id || country.name.includes(id)))) continue;
		if (entries.push(value) === 25) break;
	}

	return entries;
}

interface RawTimeZone {
	codes: string[];
	name: string;
}

export interface TimeZone {
	countries: TimeZoneCountry[];
	name: string;
	full: string;
}

export interface TimeZoneCountry {
	code: string;
	name: string;
}
