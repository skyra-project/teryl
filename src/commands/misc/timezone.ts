import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { getTimeZone, MaximumLength, MinimumLength, searchTimeZone } from '#lib/utilities/tz';
import { SlashCommandStringOption } from '@discordjs/builders';
import { Result } from '@sapphire/result';
import { isNullish } from '@sapphire/utilities';
import { AutocompleteInteractionArguments, Command, RegisterCommand, RegisterSubCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, getSupportedUserLanguageName, resolveUserKey } from '@skyra/http-framework-i18n';
import { MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.TimeZone.RootName, LanguageKeys.Commands.TimeZone.RootDescription))
export class UserCommand extends Command {
	public override async autocompleteRun(interaction: Command.AutocompleteInteraction, options: AutoCompleteOptions) {
		const entries = searchTimeZone(options.name);
		return interaction.reply({ choices: entries.map((entry) => ({ name: entry.full, value: entry.name })) });
	}

	@RegisterSubCommand((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.TimeZone.Use).addStringOption(createNameOption()))
	public async use(interaction: Command.ChatInputInteraction, options: Options) {
		const entry = getTimeZone(options.name);
		if (isNullish(entry)) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.TimeZone.InvalidTimeZone, { value: options.name });
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const id = BigInt(interaction.user.id);
		const tz = entry.name;
		const result = await Result.fromAsync(
			this.container.prisma.user.upsert({
				where: { id },
				create: { id, tz },
				update: { tz }
			})
		);

		const key = result.isOk() ? LanguageKeys.Commands.TimeZone.UseSuccess : LanguageKeys.Commands.TimeZone.UseFailure;
		const content = resolveUserKey(interaction, key, { value: tz });
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	@RegisterSubCommand((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.TimeZone.Reset))
	public async reset(interaction: Command.ChatInputInteraction) {
		const result = await Result.fromAsync(
			this.container.prisma.user.update({
				where: { id: BigInt(interaction.user.id) },
				data: { tz: null },
				select: null
			})
		);

		const key = result.isOk() ? LanguageKeys.Commands.TimeZone.ResetSuccess : LanguageKeys.Commands.TimeZone.ResetFailure;
		const content = resolveUserKey(interaction, key);
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	@RegisterSubCommand((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.TimeZone.View).addStringOption(createNameOption()))
	public async view(interaction: Command.ChatInputInteraction, options: Options) {
		const entry = getTimeZone(options.name);
		if (isNullish(entry)) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.TimeZone.InvalidTimeZone, { value: options.name });
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const dtf = new Intl.DateTimeFormat(getSupportedUserLanguageName(interaction), {
			timeZone: entry.name.replaceAll(' ', '_'),
			dateStyle: 'short',
			timeStyle: 'medium'
		});
		const content = resolveUserKey(interaction, LanguageKeys.Commands.TimeZone.ViewContent, { tz: entry.name, time: dtf.format() });
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}
}

function createNameOption() {
	return applyLocalizedBuilder(new SlashCommandStringOption(), LanguageKeys.Commands.TimeZone.OptionsName)
		.setMinLength(MinimumLength)
		.setMaxLength(MaximumLength)
		.setRequired(true)
		.setAutocomplete(true);
}

type AutoCompleteOptions = AutocompleteInteractionArguments<Options>;

interface Options {
	name: string;
}
