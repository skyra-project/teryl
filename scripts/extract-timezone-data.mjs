// eslint-disable-next-line spaced-comment
/// <reference lib="ESNext" />

import { rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGunzip } from 'node:zlib';
import { extract } from 'tar';

const response = await fetch('https://www.iana.org/time-zones/repository/tzdata-latest.tar.gz');
if (!response.ok || !response.body) {
	console.error('Failed to read the UnicodeData file, see response:');
	console.error(await response.text());
	process.exit(1);
}

const cwd = tmpdir();
const name = 'zone1970.tab';

/** @type {import('tar').ReadEntry} */
let file;
const tar = extract({ filter: (path) => path === name, cwd }).on('entry', (entry) => (file = entry));
const gzip = createGunzip().pipe(tar);
const reader = response.body.getReader();

let chunk;
while (!(chunk = await reader.read()).done) {
	gzip.write(chunk.value);
}

// @ts-ignore False positive - "Variable 'file' is used before being assigned."
if (!file) {
	console.error('File `zone1970.tab` not found.');
	process.exit(1);
}

const buffer = await file.concat();
const text = buffer.toString('utf8');
const lines = text.split(/\r?\n/g);

/** @type {{name: string}[]} */
const output = [];
for (const line of lines) {
	if (!line.length || line.startsWith('#')) continue;

	// Line:
	//     ES	+4024-00341	Europe/Madrid	Spain (mainland)
	// Format:
	// 0: Comma-separated country codes - ES
	// 1: Coordinates                   - +4024-00341
	// 2: TZ                            - Europe/Madrid
	// 3: Comments                      - Spain (mainland)
	const parts = line.split('\t');
	output.push({ name: parts[2].replaceAll('_', ' ') });
}

output.sort((a, b) => a.name.localeCompare(b.name));
const outputFile = new URL('../src/generated/data/tz.json', import.meta.url);
await writeFile(outputFile, JSON.stringify(output), 'utf8');

// Clean up the temporary file:
await rm(join(cwd, name));
