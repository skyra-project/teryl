import { EmbedColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { makeActionRow } from '#lib/utilities/discord-utilities';
import { BidirectionalCategory, Category, Class, getUnicode, type Unicode } from '#lib/utilities/unicode/backend';
import { bold, EmbedBuilder, inlineCode, italic } from '@discordjs/builders';
import { chunk, isNullish } from '@sapphire/utilities';
import type { TFunction, TypedT } from '@skyra/http-framework-i18n';
import { ComponentType, type APIEmbed, type APISelectMenuOption, type APIStringSelectComponent } from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.Unicode;

export function getUnicodeInformationEmbeds(t: TFunction, characters: readonly string[]): APIEmbed[] {
	return characters.map((character) => getUnicodeInformationEmbed(t, character));
}

export function getUnicodeInformationEmbed(t: TFunction, character: string): APIEmbed {
	const id = character.codePointAt(0)!;
	const unicode = getUnicode(id);
	const embed = new EmbedBuilder();
	const lines = [bold(`${inlineCode(character)} — ${id.toString(16).toUpperCase().padStart(4, '0')}`)] as string[];

	if (isNullish(unicode)) {
		embed.setColor(EmbedColors.Error);
		lines.push(t(Root.UnknownCharacter));
	} else {
		embed.setColor(UnicodeCategoryColorMapper[unicode.category]);
		addUnicodeInformationEmbedDescription(lines, t, unicode);
	}

	return embed.setDescription(lines.join('\n')).toJSON();
}

export function getSelectMenuComponents(t: TFunction, characters: readonly string[]) {
	const component = getSelectMenuOptions(t, characters);
	return [makeActionRow([component])];
}

export function getSelectMenuOptions(t: TFunction, characters: readonly string[]): APIStringSelectComponent {
	const pages = chunk(characters, 10);
	const totalPages = pages.length;
	return {
		type: ComponentType.StringSelect,
		custom_id: 'unicode',
		options: pages.map((page, index) => getSelectMenuOption(t, page, index, totalPages))
	};
}

function getSelectMenuOption(t: TFunction, characters: readonly string[], pageIndex: number, totalPages: number): APISelectMenuOption {
	const prefix = pageIndex === 0 ? '' : '…';
	const suffix = pageIndex + 1 === totalPages ? '' : '…';
	const string = characters.join('');
	return {
		default: pageIndex === 0,
		label: t(Root.SelectMenuOptionLabel, { page: pageIndex + 1, characters: `${prefix}“${string}”${suffix}` }),
		value: `${pageIndex}.${Buffer.from(string, 'utf8').toString('base64')}`
	};
}

function addUnicodeInformationEmbedDescription(output: string[], t: TFunction, unicode: Unicode) {
	output.push(
		t(Root.InformationBasic, {
			name: unicode.unicodeName || unicode.name,
			category: t(UnicodeCategoryKeyMapper[unicode.category]),
			bidirectionalCategory: t(UnicodeBidirectionalCategoryKeyMapper[unicode.bidirectionalCategory]),
			class:
				unicode.class >= Class.CCC10 && unicode.class <= Class.CCC132
					? Class[unicode.class]
					: t(UnicodeClassKeyMapper[unicode.class as keyof typeof UnicodeClassKeyMapper])
		})
	);

	if (unicode.value) {
		output.push(t(Root.InformationValue, { value: unicode.value }));
	}

	if (unicode.mirrored) {
		output.push(t(Root.InformationMirrored));
	}

	if (unicode.mapping.base) {
		output.push(t(Root.InformationMappingBase, { value: parseMapping(unicode.mapping.base) }));
	}

	if (unicode.mapping.lowercase) {
		output.push(t(Root.InformationMappingLowercase, { value: parseMapping(unicode.mapping.lowercase) }));
	}

	if (unicode.mapping.uppercase) {
		output.push(t(Root.InformationMappingUppercase, { value: parseMapping(unicode.mapping.uppercase) }));
	}

	if (unicode.comment) {
		output.push(t(Root.InformationComment, { value: unicode.comment }));
	}
}

function parseMapping(mapping: string) {
	return mapping
		.split(' ')
		.map((part) => (part.startsWith('<') ? italic(part) : `${inlineCode(String.fromCodePoint(parseInt(part, 16)))} ${italic(part)}`))
		.join(' + ');
}

export const UnicodeCategoryColorMapper = {
	[Category.Control]: 0x607d8b,
	[Category.Format]: 0x9e9e9e,
	[Category.PrivateUse]: 0x9e9e9e,
	[Category.Surrogate]: 0x795548,
	[Category.LowercaseLetter]: 0x03a9f4,
	[Category.ModifierLetter]: 0x03a9f4,
	[Category.OtherLetter]: 0x03a9f4,
	[Category.TitlecaseLetter]: 0x03a9f4,
	[Category.UppercaseLetter]: 0x03a9f4,
	[Category.SpacingMark]: 0x009688,
	[Category.EnclosingMark]: 0x009688,
	[Category.NonspacingMark]: 0x009688,
	[Category.DecimalNumber]: 0x3f51b5,
	[Category.LetterNumber]: 0x3f51b5,
	[Category.OtherNumber]: 0x3f51b5,
	[Category.ConnectorPunctuation]: 0x4caf50,
	[Category.DashPunctuation]: 0x4caf50,
	[Category.ClosePunctuation]: 0x4caf50,
	[Category.FinalPunctuation]: 0x4caf50,
	[Category.InitialPunctuation]: 0x4caf50,
	[Category.OtherPunctuation]: 0x4caf50,
	[Category.OpenPunctuation]: 0x4caf50,
	[Category.CurrencySymbol]: 0xffeb3b,
	[Category.ModifierSymbol]: 0xffeb3b,
	[Category.MathSymbol]: 0xffeb3b,
	[Category.OtherSymbol]: 0xffeb3b,
	[Category.LineSeparator]: 0xff9800,
	[Category.ParagraphSeparator]: 0xff9800,
	[Category.SpaceSeparator]: 0xff9800
} satisfies Record<Category, number>;

export const UnicodeCategoryKeyMapper = {
	[Category.Control]: Root.CategoryControl,
	[Category.Format]: Root.CategoryFormat,
	[Category.PrivateUse]: Root.CategoryPrivateUse,
	[Category.Surrogate]: Root.CategorySurrogate,
	[Category.LowercaseLetter]: Root.CategoryLowercaseLetter,
	[Category.ModifierLetter]: Root.CategoryModifierLetter,
	[Category.OtherLetter]: Root.CategoryOtherLetter,
	[Category.TitlecaseLetter]: Root.CategoryTitlecaseLetter,
	[Category.UppercaseLetter]: Root.CategoryUppercaseLetter,
	[Category.SpacingMark]: Root.CategorySpacingMark,
	[Category.EnclosingMark]: Root.CategoryEnclosingMark,
	[Category.NonspacingMark]: Root.CategoryNonspacingMark,
	[Category.DecimalNumber]: Root.CategoryDecimalNumber,
	[Category.LetterNumber]: Root.CategoryLetterNumber,
	[Category.OtherNumber]: Root.CategoryOtherNumber,
	[Category.ConnectorPunctuation]: Root.CategoryConnectorPunctuation,
	[Category.DashPunctuation]: Root.CategoryDashPunctuation,
	[Category.ClosePunctuation]: Root.CategoryClosePunctuation,
	[Category.FinalPunctuation]: Root.CategoryFinalPunctuation,
	[Category.InitialPunctuation]: Root.CategoryInitialPunctuation,
	[Category.OtherPunctuation]: Root.CategoryOtherPunctuation,
	[Category.OpenPunctuation]: Root.CategoryOpenPunctuation,
	[Category.CurrencySymbol]: Root.CategoryCurrencySymbol,
	[Category.ModifierSymbol]: Root.CategoryModifierSymbol,
	[Category.MathSymbol]: Root.CategoryMathSymbol,
	[Category.OtherSymbol]: Root.CategoryOtherSymbol,
	[Category.LineSeparator]: Root.CategoryLineSeparator,
	[Category.ParagraphSeparator]: Root.CategoryParagraphSeparator,
	[Category.SpaceSeparator]: Root.CategorySpaceSeparator
} satisfies Record<Category, TypedT>;

export const UnicodeBidirectionalCategoryKeyMapper = {
	[BidirectionalCategory.ArabicLetter]: Root.CategoryBidirectionalArabicLetter,
	[BidirectionalCategory.ArabicNumber]: Root.CategoryBidirectionalArabicNumber,
	[BidirectionalCategory.ParagraphSeparator]: Root.CategoryBidirectionalParagraphSeparator,
	[BidirectionalCategory.BoundaryNeutral]: Root.CategoryBidirectionalBoundaryNeutral,
	[BidirectionalCategory.CommonSeparator]: Root.CategoryBidirectionalCommonSeparator,
	[BidirectionalCategory.EuropeanNumber]: Root.CategoryBidirectionalEuropeanNumber,
	[BidirectionalCategory.EuropeanSeparator]: Root.CategoryBidirectionalEuropeanSeparator,
	[BidirectionalCategory.EuropeanTerminator]: Root.CategoryBidirectionalEuropeanTerminator,
	[BidirectionalCategory.FirstStrongIsolate]: Root.CategoryBidirectionalFirstStrongIsolate,
	[BidirectionalCategory.LeftToRight]: Root.CategoryBidirectionalLeftToRight,
	[BidirectionalCategory.LeftToRightEmbedding]: Root.CategoryBidirectionalLeftToRightEmbedding,
	[BidirectionalCategory.LeftToRightIsolate]: Root.CategoryBidirectionalLeftToRightIsolate,
	[BidirectionalCategory.LeftToRightOverride]: Root.CategoryBidirectionalLeftToRightOverride,
	[BidirectionalCategory.NonSpacingMark]: Root.CategoryBidirectionalNonSpacingMark,
	[BidirectionalCategory.OtherNeutral]: Root.CategoryBidirectionalOtherNeutral,
	[BidirectionalCategory.PopDirectionalFormat]: Root.CategoryBidirectionalPopDirectionalFormat,
	[BidirectionalCategory.PopDirectionalIsolate]: Root.CategoryBidirectionalPopDirectionalIsolate,
	[BidirectionalCategory.RightToLeft]: Root.CategoryBidirectionalRightToLeft,
	[BidirectionalCategory.RightToLeftEmbedding]: Root.CategoryBidirectionalRightToLeftEmbedding,
	[BidirectionalCategory.RightToLeftIsolate]: Root.CategoryBidirectionalRightToLeftIsolate,
	[BidirectionalCategory.RightToLeftOverride]: Root.CategoryBidirectionalRightToLeftOverride,
	[BidirectionalCategory.SegmentSeparator]: Root.CategoryBidirectionalSegmentSeparator,
	[BidirectionalCategory.WhiteSpace]: Root.CategoryBidirectionalWhiteSpace
} satisfies Record<BidirectionalCategory, TypedT>;

export const UnicodeClassKeyMapper = {
	[Class.NotReordered]: Root.ClassNotReordered,
	[Class.Overlay]: Root.ClassOverlay,
	[Class.Unnamed]: Root.ClassUnnamed,
	[Class.Nukta]: Root.ClassNukta,
	[Class.KanaVoicing]: Root.ClassKanaVoicing,
	[Class.Virama]: Root.ClassVirama,
	[Class.AttachedBelow]: Root.ClassAttachedBelow,
	[Class.AttachedAbove]: Root.ClassAttachedAbove,
	[Class.AttachedAboveRight]: Root.ClassAttachedAboveRight,
	[Class.BelowLeft]: Root.ClassBelowLeft,
	[Class.Below]: Root.ClassBelow,
	[Class.BelowRight]: Root.ClassBelowRight,
	[Class.Left]: Root.ClassLeft,
	[Class.Right]: Root.ClassRight,
	[Class.AboveLeft]: Root.ClassAboveLeft,
	[Class.Above]: Root.ClassAbove,
	[Class.AboveRight]: Root.ClassAboveRight,
	[Class.DoubleBelow]: Root.ClassDoubleBelow,
	[Class.DoubleAbove]: Root.ClassDoubleAbove,
	[Class.IotaSubscript]: Root.ClassIotaSubscript
};
