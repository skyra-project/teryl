import { EmbedColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { BidirectionalCategory, Category, Class, SearchCategory, getUnicode, searchUnicode } from '#lib/utilities/unicode';
import { EmbedBuilder, bold, inlineCode, italic } from '@discordjs/builders';
import { isNullish } from '@sapphire/utilities';
import { Command, RegisterCommand, RegisterSubcommand } from '@skyra/http-framework';
import {
	applyLocalizedBuilder,
	createSelectMenuChoiceName,
	getSupportedUserLanguageT,
	type TFunction,
	type TypedT
} from '@skyra/http-framework-i18n';
import { ApplicationIntegrationType, InteractionContextType, MessageFlags } from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.Unicode;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription) //
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
)
export class UserCommand extends Command {
	@RegisterSubcommand((builder) =>
		applyLocalizedBuilder(builder, Root.Inspect) //
			.addStringOption((builder) => applyLocalizedBuilder(builder, Root.OptionsCharacter).setRequired(true))
	)
	public async inspect(interaction: Command.ChatInputInteraction, options: InspectOptions) {
		const ids = [...options.character];
		const t = getSupportedUserLanguageT(interaction);
		const content = ids.length > 10 ? t(Root.TooManyCharacters) : '';
		const embeds = ids.slice(0, 10).map((id) => this.getInformation(t, id));
		return interaction.reply({ content, embeds, flags: MessageFlags.Ephemeral });
	}

	@RegisterSubcommand((builder) =>
		applyLocalizedBuilder(builder, Root.Search) //
			.addStringOption((builder) => applyLocalizedBuilder(builder, Root.OptionsCharacter).setRequired(true).setAutocomplete(true))
			.addStringOption((builder) =>
				applyLocalizedBuilder(builder, Root.OptionsCategory).setChoices(
					createSelectMenuChoiceName(Root.CategoryControl, { value: 'Control' }),
					createSelectMenuChoiceName(Root.CategoryFormat, { value: 'Format' }),
					createSelectMenuChoiceName(Root.CategoryPrivateUse, { value: 'PrivateUse' }),
					createSelectMenuChoiceName(Root.CategorySurrogate, { value: 'Surrogate' }),
					createSelectMenuChoiceName(Root.CategoryLowercaseLetter, { value: 'LowercaseLetter' }),
					createSelectMenuChoiceName(Root.CategoryModifierLetter, { value: 'ModifierLetter' }),
					createSelectMenuChoiceName(Root.CategoryOtherLetter, { value: 'OtherLetter' }),
					createSelectMenuChoiceName(Root.CategoryTitlecaseLetter, { value: 'TitlecaseLetter' }),
					createSelectMenuChoiceName(Root.CategoryUppercaseLetter, { value: 'UppercaseLetter' }),
					createSelectMenuChoiceName(Root.CategoryGroupMark, { value: 'Mark' }),
					createSelectMenuChoiceName(Root.CategoryDecimalNumber, { value: 'DecimalNumber' }),
					createSelectMenuChoiceName(Root.CategoryLetterNumber, { value: 'LetterNumber' }),
					createSelectMenuChoiceName(Root.CategoryOtherNumber, { value: 'OtherNumber' }),
					createSelectMenuChoiceName(Root.CategoryGroupPunctuation, { value: 'Punctuation' }),
					createSelectMenuChoiceName(Root.CategoryCurrencySymbol, { value: 'CurrencySymbol' }),
					createSelectMenuChoiceName(Root.CategoryModifierSymbol, { value: 'ModifierSymbol' }),
					createSelectMenuChoiceName(Root.CategoryMathSymbol, { value: 'MathSymbol' }),
					createSelectMenuChoiceName(Root.CategoryOtherSymbol, { value: 'OtherSymbol' }),
					createSelectMenuChoiceName(Root.CategoryGroupSeparator, { value: 'Separator' })
				)
			)
			.addNumberOption((builder) =>
				applyLocalizedBuilder(builder, Root.OptionsBidirectionalCategory).setChoices(
					...Object.entries(UserCommand.UnicodeBidirectionalCategoryKeyMapper) //
						.map(([key, value]) => createSelectMenuChoiceName(value, { value: Number(key) }))
				)
			)
			.addNumberOption((builder) =>
				applyLocalizedBuilder(builder, Root.OptionsClass).setChoices(
					...Object.entries(UserCommand.UnicodeClassKeyMapper) //
						.map(([key, value]) => createSelectMenuChoiceName(value, { value: Number(key) }))
				)
			)
	)
	public search(interaction: Command.ChatInputInteraction, options: SearchOptions) {
		return this.inspect(interaction, { character: options.character });
	}

	public override async autocompleteRun(interaction: Command.AutocompleteInteraction, options: Command.AutocompleteArguments<SearchOptions>) {
		const entries = searchUnicode({
			character: options.character,
			category: options.category,
			bidirectionalCategory: options['bidirectional-category'],
			class: options.class
		});

		return interaction.reply({
			choices: entries.map((entry) => ({
				name: `${entry.score === 1 ? '⭐' : '📄'} ${entry.value.unicodeName || entry.value.name} (${String.fromCodePoint(entry.value.id)})`,
				value: String.fromCodePoint(entry.value.id)
			}))
		});
	}

	private getInformation(t: TFunction, character: string) {
		const id = character.codePointAt(0)!;
		const unicode = getUnicode(id);
		const embed = new EmbedBuilder();
		const lines = [bold(`${inlineCode(character)} — ${id.toString(16).toUpperCase().padStart(4, '0')}`)] as string[];

		if (isNullish(unicode)) {
			embed.setColor(EmbedColors.Error);
			lines.push(t(Root.UnknownCharacter));
		} else {
			embed.setColor(UserCommand.UnicodeCategoryColorMapper[unicode.category]);
			lines.push(
				t(Root.InformationBasic, {
					name: unicode.unicodeName || unicode.name,
					category: t(UserCommand.UnicodeCategoryKeyMapper[unicode.category]),
					bidirectionalCategory: t(UserCommand.UnicodeBidirectionalCategoryKeyMapper[unicode.bidirectionalCategory]),
					class:
						unicode.class >= Class.CCC10 && unicode.class <= Class.CCC132
							? Class[unicode.class]
							: t(UserCommand.UnicodeClassKeyMapper[unicode.class as keyof typeof UserCommand.UnicodeClassKeyMapper])
				})
			);
			if (unicode.value) lines.push(t(Root.InformationValue, { value: unicode.value }));
			if (unicode.mirrored) lines.push(t(Root.InformationMirrored));
			if (unicode.mapping.base) {
				lines.push(t(Root.InformationMappingBase, { value: this.parseMapping(unicode.mapping.base) }));
			}
			if (unicode.mapping.lowercase) {
				lines.push(t(Root.InformationMappingLowercase, { value: this.parseMapping(unicode.mapping.lowercase) }));
			}
			if (unicode.mapping.uppercase) {
				lines.push(t(Root.InformationMappingUppercase, { value: this.parseMapping(unicode.mapping.uppercase) }));
			}
			if (unicode.comment) lines.push(t(Root.InformationComment, { value: unicode.comment }));
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

	private static readonly UnicodeBidirectionalCategoryKeyMapper = {
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

	private static readonly UnicodeClassKeyMapper = {
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
}

interface InspectOptions {
	character: string;
}

interface SearchOptions {
	character: string;
	category?: keyof typeof SearchCategory;
	'bidirectional-category'?: BidirectionalCategory;
	class?: Class;
}
