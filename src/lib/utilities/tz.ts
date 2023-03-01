import { PathSrc } from '#lib/common/constants';
import { readFile } from 'node:fs/promises';

const PathTimeZone = new URL('./generated/data/tz.json', PathSrc);
const tz = new Map<string, TimeZone>();

export let MinimumLength = 100;
export let MaximumLength = 0;
for (const entry of JSON.parse(await readFile(PathTimeZone, 'utf8')) as TimeZone[]) {
	tz.set(entry.name.toLowerCase(), entry);

	if (entry.name.length < MinimumLength) MinimumLength = entry.name.length;
	if (entry.name.length > MaximumLength) MaximumLength = entry.name.length;
}

export function getTimeZone(id: string) {
	return tz.get(id.toLowerCase()) ?? null;
}

export function searchTimeZone(id: string) {
	if (id.length > MaximumLength) return [];

	id = id.toLowerCase();
	const entries = [] as TimeZone[];
	for (const [key, value] of tz.entries()) {
		if (!key.includes(id)) continue;
		if (entries.push(value) === 25) break;
	}

	return entries;
}

export interface TimeZone {
	name: string;
}
