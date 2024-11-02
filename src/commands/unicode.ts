import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import {
	BidirectionalCategory,
	Class,
	SearchCategory,
	UnicodeBidirectionalCategoryKeyMapper,
	UnicodeClassKeyMapper,
	getSelectMenuComponents,
	getUnicodeInformationEmbeds,
	searchUnicode
} from '#lib/unicode';
import { Command, RegisterCommand, RegisterSubcommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, createSelectMenuChoiceName, getSupportedUserLanguageT } from '@skyra/http-framework-i18n';
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
		const content = ids.length > 250 ? t(Root.TooManyCharacters) : '';
		const characters = ids.slice(0, 250);

		const components = characters.length > 10 ? getSelectMenuComponents(t, characters) : undefined;
		const embeds = getUnicodeInformationEmbeds(t, characters.slice(0, 10));
		return interaction.reply({ content, embeds, components, flags: MessageFlags.Ephemeral });
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
					...Object.entries(UnicodeBidirectionalCategoryKeyMapper) //
						.map(([key, value]) => createSelectMenuChoiceName(value, { value: Number(key) }))
				)
			)
			.addNumberOption((builder) =>
				applyLocalizedBuilder(builder, Root.OptionsClass).setChoices(
					...Object.entries(UnicodeClassKeyMapper) //
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
