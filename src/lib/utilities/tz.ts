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

function getSearchScore(id: string, key: string, value: TimeZone) {
	if (key === id) return 1;

	let score = key.includes(id) ? id.length / key.length : 0;
	for (const country of value.countries) {
		if (country.name === id || country.code === id) return 1;
		if (country.name.includes(id)) score = Math.max(score, id.length / country.name.length);
	}

	return score;
}

export function searchTimeZone(id: string) {
	if (id.length > MaximumLength) return [];

	id = id.toLowerCase();
	const entries = [] as [score: number, value: TimeZone][];
	for (const [key, value] of tz.entries()) {
		const score = getSearchScore(id, key, value);
		if (score === 0) continue;
		if (entries.push([score, value]) === 25) break;
	}

	return entries.sort((a, b) => b[0] - a[0]).map((entry) => entry[1]);
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
