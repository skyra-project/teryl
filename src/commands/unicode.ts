import { EmbedColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { BidirectionalCategory, Category, Class, getUnicode } from '#lib/utilities/unicode';
import { EmbedBuilder, bold, inlineCode, italic } from '@discordjs/builders';
import { isNullish } from '@sapphire/utilities';
import { Command, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, getSupportedUserLanguageT, type TFunction, type TypedT } from '@skyra/http-framework-i18n';
import { MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.Unicode.RootName, LanguageKeys.Commands.Unicode.RootDescription).addStringOption((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Unicode.OptionsCharacter).setRequired(true)
	)
)
export class UserCommand extends Command {
	public override async chatInputRun(interaction: Command.ChatInputInteraction, options: Options) {
		const ids = [...options.character];
		const t = getSupportedUserLanguageT(interaction);
		const content = ids.length > 10 ? t(LanguageKeys.Commands.Unicode.TooManyCharacters) : '';
		const embeds = ids.slice(0, 10).map((id) => this.getInformation(t, id));
		return interaction.reply({ content, embeds, flags: MessageFlags.Ephemeral });
	}

	private getInformation(t: TFunction, character: string) {
		const id = character.codePointAt(0)!;
		const unicode = getUnicode(id);
		const embed = new EmbedBuilder();
		const lines = [bold(`${inlineCode(character)} — ${id.toString(16).toUpperCase().padStart(4, '0')}`)] as string[];

		if (isNullish(unicode)) {
			embed.setColor(EmbedColors.Error);
			lines.push(t(LanguageKeys.Commands.Unicode.UnknownCharacter));
		} else {
			embed.setColor(UserCommand.UnicodeCategoryColorMapper[unicode.category]);
			lines.push(
				t(LanguageKeys.Commands.Unicode.InformationBasic, {
					name: unicode.unicodeName || unicode.name,
					category: t(UserCommand.UnicodeCategoryKeyMapper[unicode.category]),
					bidirectionalCategory: t(UserCommand.UnicodeBidirectionalCategoryKeyMapper[unicode.bidirectionalCategory]),
					class:
						unicode.class >= Class.CCC10 && unicode.class <= Class.CCC132
							? Class[unicode.class]
							: t(UserCommand.UnicodeClassKeyMapper[unicode.class as keyof typeof UserCommand.UnicodeClassKeyMapper])
				})
			);
			if (unicode.value) lines.push(t(LanguageKeys.Commands.Unicode.InformationValue, { value: unicode.value }));
			if (unicode.mirrored) lines.push(t(LanguageKeys.Commands.Unicode.InformationMirrored));
			if (unicode.mapping.base) {
				lines.push(t(LanguageKeys.Commands.Unicode.InformationMappingBase, { value: this.parseMapping(unicode.mapping.base) }));
			}
			if (unicode.mapping.lowercase) {
				lines.push(t(LanguageKeys.Commands.Unicode.InformationMappingLowercase, { value: this.parseMapping(unicode.mapping.lowercase) }));
			}
			if (unicode.mapping.uppercase) {
				lines.push(t(LanguageKeys.Commands.Unicode.InformationMappingUppercase, { value: this.parseMapping(unicode.mapping.uppercase) }));
			}
			if (unicode.comment) lines.push(t(LanguageKeys.Commands.Unicode.InformationComment, { value: unicode.comment }));
		}

		return embed.setDescription(lines.join('\n')).toJSON();
	}

	private parseMapping(mapping: string) {
		return mapping
			.split(' ')
			.map((part) => (part.startsWith('<') ? italic(part) : `${inlineCode(String.fromCodePoint(parseInt(part, 16)))} ${italic(part)}`))
			.join(' + ');
	}

	private static readonly UnicodeCategoryColorMapper = {
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

	private static readonly UnicodeCategoryKeyMapper = {
		[Category.Control]: LanguageKeys.Commands.Unicode.CategoryControl,
		[Category.Format]: LanguageKeys.Commands.Unicode.CategoryFormat,
		[Category.PrivateUse]: LanguageKeys.Commands.Unicode.CategoryPrivateUse,
		[Category.Surrogate]: LanguageKeys.Commands.Unicode.CategorySurrogate,
		[Category.LowercaseLetter]: LanguageKeys.Commands.Unicode.CategoryLowercaseLetter,
		[Category.ModifierLetter]: LanguageKeys.Commands.Unicode.CategoryModifierLetter,
		[Category.OtherLetter]: LanguageKeys.Commands.Unicode.CategoryOtherLetter,
		[Category.TitlecaseLetter]: LanguageKeys.Commands.Unicode.CategoryTitlecaseLetter,
		[Category.UppercaseLetter]: LanguageKeys.Commands.Unicode.CategoryUppercaseLetter,
		[Category.SpacingMark]: LanguageKeys.Commands.Unicode.CategorySpacingMark,
		[Category.EnclosingMark]: LanguageKeys.Commands.Unicode.CategoryEnclosingMark,
		[Category.NonspacingMark]: LanguageKeys.Commands.Unicode.CategoryNonspacingMark,
		[Category.DecimalNumber]: LanguageKeys.Commands.Unicode.CategoryDecimalNumber,
		[Category.LetterNumber]: LanguageKeys.Commands.Unicode.CategoryLetterNumber,
		[Category.OtherNumber]: LanguageKeys.Commands.Unicode.CategoryOtherNumber,
		[Category.ConnectorPunctuation]: LanguageKeys.Commands.Unicode.CategoryConnectorPunctuation,
		[Category.DashPunctuation]: LanguageKeys.Commands.Unicode.CategoryDashPunctuation,
		[Category.ClosePunctuation]: LanguageKeys.Commands.Unicode.CategoryClosePunctuation,
		[Category.FinalPunctuation]: LanguageKeys.Commands.Unicode.CategoryFinalPunctuation,
		[Category.InitialPunctuation]: LanguageKeys.Commands.Unicode.CategoryInitialPunctuation,
		[Category.OtherPunctuation]: LanguageKeys.Commands.Unicode.CategoryOtherPunctuation,
		[Category.OpenPunctuation]: LanguageKeys.Commands.Unicode.CategoryOpenPunctuation,
		[Category.CurrencySymbol]: LanguageKeys.Commands.Unicode.CategoryCurrencySymbol,
		[Category.ModifierSymbol]: LanguageKeys.Commands.Unicode.CategoryModifierSymbol,
		[Category.MathSymbol]: LanguageKeys.Commands.Unicode.CategoryMathSymbol,
		[Category.OtherSymbol]: LanguageKeys.Commands.Unicode.CategoryOtherSymbol,
		[Category.LineSeparator]: LanguageKeys.Commands.Unicode.CategoryLineSeparator,
		[Category.ParagraphSeparator]: LanguageKeys.Commands.Unicode.CategoryParagraphSeparator,
		[Category.SpaceSeparator]: LanguageKeys.Commands.Unicode.CategorySpaceSeparator
	} satisfies Record<Category, TypedT>;

	private static readonly UnicodeBidirectionalCategoryKeyMapper = {
		[BidirectionalCategory.ArabicLetter]: LanguageKeys.Commands.Unicode.CategoryBidirectionalArabicLetter,
		[BidirectionalCategory.ArabicNumber]: LanguageKeys.Commands.Unicode.CategoryBidirectionalArabicNumber,
		[BidirectionalCategory.ParagraphSeparator]: LanguageKeys.Commands.Unicode.CategoryBidirectionalParagraphSeparator,
		[BidirectionalCategory.BoundaryNeutral]: LanguageKeys.Commands.Unicode.CategoryBidirectionalBoundaryNeutral,
		[BidirectionalCategory.CommonSeparator]: LanguageKeys.Commands.Unicode.CategoryBidirectionalCommonSeparator,
		[BidirectionalCategory.EuropeanNumber]: LanguageKeys.Commands.Unicode.CategoryBidirectionalEuropeanNumber,
		[BidirectionalCategory.EuropeanSeparator]: LanguageKeys.Commands.Unicode.CategoryBidirectionalEuropeanSeparator,
		[BidirectionalCategory.EuropeanTerminator]: LanguageKeys.Commands.Unicode.CategoryBidirectionalEuropeanTerminator,
		[BidirectionalCategory.FirstStrongIsolate]: LanguageKeys.Commands.Unicode.CategoryBidirectionalFirstStrongIsolate,
		[BidirectionalCategory.LeftToRight]: LanguageKeys.Commands.Unicode.CategoryBidirectionalLeftToRight,
		[BidirectionalCategory.LeftToRightEmbedding]: LanguageKeys.Commands.Unicode.CategoryBidirectionalLeftToRightEmbedding,
		[BidirectionalCategory.LeftToRightIsolate]: LanguageKeys.Commands.Unicode.CategoryBidirectionalLeftToRightIsolate,
		[BidirectionalCategory.LeftToRightOverride]: LanguageKeys.Commands.Unicode.CategoryBidirectionalLeftToRightOverride,
		[BidirectionalCategory.NonSpacingMark]: LanguageKeys.Commands.Unicode.CategoryBidirectionalNonSpacingMark,
		[BidirectionalCategory.OtherNeutral]: LanguageKeys.Commands.Unicode.CategoryBidirectionalOtherNeutral,
		[BidirectionalCategory.PopDirectionalFormat]: LanguageKeys.Commands.Unicode.CategoryBidirectionalPopDirectionalFormat,
		[BidirectionalCategory.PopDirectionalIsolate]: LanguageKeys.Commands.Unicode.CategoryBidirectionalPopDirectionalIsolate,
		[BidirectionalCategory.RightToLeft]: LanguageKeys.Commands.Unicode.CategoryBidirectionalRightToLeft,
		[BidirectionalCategory.RightToLeftEmbedding]: LanguageKeys.Commands.Unicode.CategoryBidirectionalRightToLeftEmbedding,
		[BidirectionalCategory.RightToLeftIsolate]: LanguageKeys.Commands.Unicode.CategoryBidirectionalRightToLeftIsolate,
		[BidirectionalCategory.RightToLeftOverride]: LanguageKeys.Commands.Unicode.CategoryBidirectionalRightToLeftOverride,
		[BidirectionalCategory.SegmentSeparator]: LanguageKeys.Commands.Unicode.CategoryBidirectionalSegmentSeparator,
		[BidirectionalCategory.WhiteSpace]: LanguageKeys.Commands.Unicode.CategoryBidirectionalWhiteSpace
	} satisfies Record<BidirectionalCategory, TypedT>;

	private static readonly UnicodeClassKeyMapper = {
		[Class.NotReordered]: LanguageKeys.Commands.Unicode.ClassNotReordered,
		[Class.Overlay]: LanguageKeys.Commands.Unicode.ClassOverlay,
		[Class.Unnamed]: LanguageKeys.Commands.Unicode.ClassUnnamed,
		[Class.Nukta]: LanguageKeys.Commands.Unicode.ClassNukta,
		[Class.KanaVoicing]: LanguageKeys.Commands.Unicode.ClassKanaVoicing,
		[Class.Virama]: LanguageKeys.Commands.Unicode.ClassVirama,
		[Class.AttachedBelow]: LanguageKeys.Commands.Unicode.ClassAttachedBelow,
		[Class.AttachedAbove]: LanguageKeys.Commands.Unicode.ClassAttachedAbove,
		[Class.AttachedAboveRight]: LanguageKeys.Commands.Unicode.ClassAttachedAboveRight,
		[Class.BelowLeft]: LanguageKeys.Commands.Unicode.ClassBelowLeft,
		[Class.Below]: LanguageKeys.Commands.Unicode.ClassBelow,
		[Class.BelowRight]: LanguageKeys.Commands.Unicode.ClassBelowRight,
		[Class.Left]: LanguageKeys.Commands.Unicode.ClassLeft,
		[Class.Right]: LanguageKeys.Commands.Unicode.ClassRight,
		[Class.AboveLeft]: LanguageKeys.Commands.Unicode.ClassAboveLeft,
		[Class.Above]: LanguageKeys.Commands.Unicode.ClassAbove,
		[Class.AboveRight]: LanguageKeys.Commands.Unicode.ClassAboveRight,
		[Class.DoubleBelow]: LanguageKeys.Commands.Unicode.ClassDoubleBelow,
		[Class.DoubleAbove]: LanguageKeys.Commands.Unicode.ClassDoubleAbove,
		[Class.IotaSubscript]: LanguageKeys.Commands.Unicode.ClassIotaSubscript
	};
}

interface Options {
	character: string;
}
