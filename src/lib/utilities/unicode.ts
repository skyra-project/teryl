import { PathSrc } from '#lib/common/constants';
import { isNullish, isNullishOrEmpty } from '@sapphire/utilities';
import { readFile } from 'fs/promises';

const PathUnicode = new URL('./generated/data/unicode.json', PathSrc);
const unicode = new Map((JSON.parse(await readFile(PathUnicode, 'utf8')) as Unicode[]).map((data) => [data.id, data] as const));

export function getUnicode(id: string | number) {
	if (typeof id === 'string') id = id.codePointAt(0) ?? 0;
	return unicode.get(id) ?? null;
}

export function getUnicodeEmojiName(id: string | number) {
	const unicode = getUnicode(id);
	if (isNullish(unicode)) return null;
	if (!isNullishOrEmpty(unicode.unicodeName)) return unicode.unicodeName.toLowerCase().replaceAll(' ', '_').slice(0, 32);
	return unicode.name.toLowerCase().replaceAll(' ', '_').slice(0, 32);
}

const DefaultUnicodeMatches = [...'abcdefghijklmnopqrstuvwxy'].map((char) => getUnicode(char)!);

export function searchUnicode(options: SearchOptions): UnicodeSearchResult[] {
	const input = options.character.trim().toUpperCase();

	const fns: ((unicode: Unicode) => boolean)[] = [];
	if (!isNullishOrEmpty(options.category)) {
		const category = SearchCategory[options.category];
		if (Array.isArray(category)) fns.push((unicode) => category.includes(unicode.category));
		else fns.push((unicode) => unicode.category === category);
	}

	if (!isNullishOrEmpty(options.bidirectionalCategory)) {
		fns.push((unicode) => unicode.bidirectionalCategory === options.bidirectionalCategory);
	}

	if (!isNullishOrEmpty(options.class)) {
		fns.push((unicode) => unicode.class === options.class);
	}

	if (input.length === 0) {
		// If there are no functions, return an array of letters only
		const entries = fns.length === 0 ? DefaultUnicodeMatches : searchUnicodeByFilters(fns);
		return entries.map((value) => ({ score: 1, value }));
	}

	const entries = [] as UnicodeSearchResult[];

	// If the input is a single unicode character, search for it directly:
	if (isNullish(input.codePointAt(1))) {
		const entry = getUnicode(input);
		if (entry && (fns.length === 0 || fns.every((fn) => fn(entry)))) {
			entries.push({ score: 1, value: entry });
		}
	}

	if (fns.length === 0) {
		for (const value of unicode.values()) {
			const score = getSearchScore(input, value.unicodeName);
			if (score !== 0) entries.push({ score, value });
		}
	} else {
		for (const value of unicode.values()) {
			if (!fns.every((fn) => fn(value))) continue;

			const score = getSearchScore(input, value.unicodeName);
			if (score !== 0) entries.push({ score, value });
		}
	}

	return entries.sort((a, b) => b.score - a.score).slice(0, 25);
}

function searchUnicodeByFilters(fns: ((unicode: Unicode) => boolean)[]) {
	const entries = [] as Unicode[];
	for (const value of unicode.values()) {
		if (!fns.every((fn) => fn(value))) continue;

		entries.push(value);
		if (entries.length === 25) break;
	}

	return entries;
}

export interface UnicodeSearchResult {
	score: number;
	value: Unicode;
}

function getSearchScore(id: string, key: string) {
	if (key === id) return 1;

	return key.includes(id) ? id.length / key.length : 0;
}

export interface SearchOptions {
	character: string;
	category?: keyof typeof SearchCategory;
	bidirectionalCategory?: BidirectionalCategory;
	class?: Class;
}

export interface Unicode {
	id: number;
	name: string;
	category: Category;
	class: Class;
	bidirectionalCategory: BidirectionalCategory;
	mapping: Mapping;
	value: number | null;
	mirrored: boolean;
	unicodeName: string;
	comment: string;
}

/**
 * @see {@link https://www.compart.com/en/unicode/bidiclass}
 */
export enum BidirectionalCategory {
	// AL
	ArabicLetter,
	// AN
	ArabicNumber,
	// B
	ParagraphSeparator,
	// BN
	BoundaryNeutral,
	// CS
	CommonSeparator,
	// EN
	EuropeanNumber,
	// ES
	EuropeanSeparator,
	// ET
	EuropeanTerminator,
	// FSI
	FirstStrongIsolate,
	// L
	LeftToRight,
	// LRE
	LeftToRightEmbedding,
	// LRI
	LeftToRightIsolate,
	// LRO
	LeftToRightOverride,
	// NSM
	NonSpacingMark,
	// ON
	OtherNeutral,
	// PDF
	PopDirectionalFormat,
	// PDI
	PopDirectionalIsolate,
	// R
	RightToLeft,
	// RLE
	RightToLeftEmbedding,
	// RLI
	RightToLeftIsolate,
	// RLO
	RightToLeftOverride,
	// S
	SegmentSeparator,
	// WS
	WhiteSpace
}

/**
 * @see {@link https://www.compart.com/en/unicode/category}
 */
export enum Category {
	// Cc
	Control,
	// Cf
	Format,
	// Co
	PrivateUse,
	// Cs
	Surrogate,
	// Ll
	LowercaseLetter,
	// Lm
	ModifierLetter,
	// Lo
	OtherLetter,
	// Lt
	TitlecaseLetter,
	// Lu
	UppercaseLetter,
	// Mc
	SpacingMark,
	// Me
	EnclosingMark,
	// Mn
	NonspacingMark,
	// Nd
	DecimalNumber,
	// Nl
	LetterNumber,
	// No
	OtherNumber,
	// Pc
	ConnectorPunctuation,
	// Pd
	DashPunctuation,
	// Pe
	ClosePunctuation,
	// Pf
	FinalPunctuation,
	// Pi
	InitialPunctuation,
	// Po
	OtherPunctuation,
	// Ps
	OpenPunctuation,
	// Sc
	CurrencySymbol,
	// Sk
	ModifierSymbol,
	// Sm
	MathSymbol,
	// So
	OtherSymbol,
	// Zl
	LineSeparator,
	// Zp
	ParagraphSeparator,
	// Zs
	SpaceSeparator
}

/**
 * @see {@link https://www.compart.com/en/unicode/combining}
 */
export enum Class {
	NotReordered,
	Overlay,
	Unnamed = 6,
	Nukta,
	KanaVoicing,
	Virama,
	CCC10,
	CCC11,
	CCC12,
	CCC13,
	CCC14,
	CCC15,
	CCC16,
	CCC17,
	CCC18,
	CCC19,
	CCC20,
	CCC21,
	CCC22,
	CCC23,
	CCC24,
	CCC25,
	CCC26,
	CCC27,
	CCC28,
	CCC29,
	CCC30,
	CCC31,
	CCC32,
	CCC33,
	CCC34,
	CCC35,
	CCC36,
	CCC84 = 84,
	CCC91 = 91,
	CCC103 = 103,
	CCC107 = 107,
	CCC118 = 118,
	CCC122 = 122,
	CCC129 = 129,
	CCC130,
	CCC132 = 132,
	AttachedBelow = 202,
	AttachedAbove = 214,
	AttachedAboveRight = 216,
	BelowLeft = 218,
	Below = 220,
	BelowRight = 222,
	Left = 224,
	Right = 226,
	AboveLeft = 228,
	Above = 230,
	AboveRight = 232,
	DoubleBelow,
	DoubleAbove,
	IotaSubscript = 240
}

export interface Mapping {
	base: string;
	uppercase: string;
	lowercase: string;
	titlecase: string;
}

export const SearchCategory = {
	Control: Category.Control,
	Format: Category.Format,
	PrivateUse: Category.PrivateUse,
	Surrogate: Category.Surrogate,
	LowercaseLetter: Category.LowercaseLetter,
	ModifierLetter: Category.ModifierLetter,
	OtherLetter: Category.OtherLetter,
	TitlecaseLetter: Category.TitlecaseLetter,
	UppercaseLetter: Category.UppercaseLetter,
	Mark: [Category.SpacingMark, Category.EnclosingMark, Category.NonspacingMark],
	DecimalNumber: Category.DecimalNumber,
	LetterNumber: Category.LetterNumber,
	OtherNumber: Category.OtherNumber,
	Punctuation: [
		Category.ConnectorPunctuation,
		Category.DashPunctuation,
		Category.ClosePunctuation,
		Category.FinalPunctuation,
		Category.InitialPunctuation,
		Category.OtherPunctuation,
		Category.OpenPunctuation
	],
	CurrencySymbol: Category.CurrencySymbol,
	ModifierSymbol: Category.ModifierSymbol,
	MathSymbol: Category.MathSymbol,
	OtherSymbol: Category.OtherSymbol,
	Separator: [Category.LineSeparator, Category.ParagraphSeparator, Category.SpaceSeparator]
} as const;
