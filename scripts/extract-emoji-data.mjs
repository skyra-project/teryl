// eslint-disable-next-line spaced-comment
/// <reference lib="ESNext" />

// Script to extract the emoji names, this differs from the UNICODE script in that it supports emoji variations (such as
// ❤️ red heart and ❤️‍🔥 red heart on fire) and it also supports the emoji presentation selector (such as 🏳️‍🌈 rainbow flag).
import { writeFile } from 'node:fs/promises';

const response = await fetch('https://unicode.org/Public/emoji/latest/emoji-test.txt');
const text = await response.text();
if (!response.ok) {
	console.error('Failed to read the UnicodeData file, see response:');
	console.error(text);
	process.exit(1);
}

// id                                                       type                  em ver   name
// 1F3F3 FE0F 200D 26A7 FE0F                              ; fully-qualified     # 🏳️‍⚧️ E13.0 transgender flag
const output = [];
for (const line of text.split('\n')) {
	if (line.length === 0) continue;
	if (line.startsWith('#')) continue;

	const separatorIndex = line.indexOf(';');
	if (separatorIndex === -1) continue;

	const commentIndex = line.indexOf('#', separatorIndex);
	if (commentIndex === -1) continue;

	const type = line.slice(separatorIndex + 1, commentIndex).trim();
	if (type !== 'fully-qualified') continue;

	const version = line.indexOf(' ', commentIndex + 2);
	if (version === -1) continue;

	const nameIndex = line.indexOf(' ', version + 1);
	if (nameIndex === -1) continue;

	const id = line.slice(0, separatorIndex).trimEnd().toLowerCase().replaceAll(' ', '-');
	const name = line.slice(nameIndex + 1).trim();

	output.push({ id, name });
}

const outputFile = new URL('../src/generated/data/emoji.json', import.meta.url);
await writeFile(outputFile, JSON.stringify(output, undefined, '\t'), 'utf8');
