import { writeFile } from 'fs/promises';

const response = await fetch('https://unicode.org/Public/UNIDATA/UnicodeData.txt');
const text = await response.text();
if (!response.ok) {
	console.error('Failed to read the UnicodeData file, see response:');
	console.error(text);
	process.exit(1);
}

function Enum(...entries) {
	return Object.fromEntries(entries.map((category, index) => [category, index]));
}

const Category = Enum(
	'Cc',
	'Cf',
	'Co',
	'Cs',
	'Ll',
	'Lm',
	'Lo',
	'Lt',
	'Lu',
	'Mc',
	'Me',
	'Mn',
	'Nd',
	'Nl',
	'No',
	'Pc',
	'Pd',
	'Pe',
	'Pf',
	'Pi',
	'Po',
	'Ps',
	'Sc',
	'Sk',
	'Sm',
	'So',
	'Zl',
	'Zp',
	'Zs'
);

const Bidirectional = Enum(
	'AL',
	'AN',
	'B',
	'BN',
	'CS',
	'EN',
	'ES',
	'ET',
	'FSI',
	'L',
	'LRE',
	'LRI',
	'LRO',
	'NSM',
	'ON',
	'PDF',
	'PDI',
	'R',
	'RLE',
	'RLI',
	'RLO',
	'S',
	'WS'
);

const output = [];
for (const line of text.split('\n')) {
	if (line.length === 0) continue;

	const parts = line.split(';');
	output.push({
		id: parseInt(parts[0], 16),
		name: parts[1],
		category: Category[parts[2]],
		class: parseInt(parts[3], 10),
		bidirectionalCategory: Bidirectional[parts[4]],
		mapping: {
			base: parts[5],
			uppercase: parts[12],
			lowercase: parts[13]
		},
		value: {
			decimal: parts[6] ? Number(parts[6]) : null,
			digit: parts[7] ? Number(parts[7]) : null,
			numeric: parts[8] ? Number(parts[8]) : null
		},
		mirrored: parts[9] === 'Y',
		unicodeName: parts[10],
		comment: parts[11]
	});
}

const outputFile = new URL('../assets/data/unicode.json', import.meta.url);
await writeFile(outputFile, JSON.stringify(output), 'utf8');
