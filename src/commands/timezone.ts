import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { getTimeZone, MaximumLength, MinimumLength, searchTimeZone } from '#lib/utilities/tz';
import { SlashCommandStringOption } from '@discordjs/builders';
import { Result } from '@sapphire/result';
import { isNullish } from '@sapphire/utilities';
import { Command, RegisterCommand, RegisterSubcommand, type AutocompleteInteractionArguments } from '@skyra/http-framework';
import { applyLocalizedBuilder, getSupportedUserLanguageName, resolveUserKey } from '@skyra/http-framework-i18n';
import { InteractionContextType, MessageFlags } from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.TimeZone;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription) //
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
)
export class UserCommand extends Command {
	public override async autocompleteRun(interaction: Command.AutocompleteInteraction, options: AutoCompleteOptions) {
		const entries = searchTimeZone(options.name);
		return interaction.reply({
			choices: entries.map((entry) => ({
				name: `${entry.score === 1 ? '⭐' : '📄'} ${entry.value.full}`,
				value: entry.value.name
			}))
		});
	}

	@RegisterSubcommand((builder) => applyLocalizedBuilder(builder, Root.Use).addStringOption(createNameOption()))
	public async use(interaction: Command.ChatInputInteraction, options: Options) {
		const entry = getTimeZone(options.name);
		if (isNullish(entry)) {
			const content = resolveUserKey(interaction, Root.InvalidTimeZone, { value: options.name });
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

		const key = result.isOk() ? Root.UseSuccess : Root.UseFailure;
		const content = resolveUserKey(interaction, key, { value: tz });
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	@RegisterSubcommand((builder) => applyLocalizedBuilder(builder, Root.Reset))
	public async reset(interaction: Command.ChatInputInteraction) {
		const result = await Result.fromAsync(
			this.container.prisma.user.update({
				where: { id: BigInt(interaction.user.id) },
				data: { tz: null },
				select: null
			})
		);

		const key = result.isOk() ? Root.ResetSuccess : Root.ResetFailure;
		const content = resolveUserKey(interaction, key);
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	@RegisterSubcommand((builder) => applyLocalizedBuilder(builder, Root.View).addStringOption(createNameOption()))
	public async view(interaction: Command.ChatInputInteraction, options: Options) {
		const entry = getTimeZone(options.name);
		if (isNullish(entry)) {
			const content = resolveUserKey(interaction, Root.InvalidTimeZone, { value: options.name });
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const dtf = new Intl.DateTimeFormat(getSupportedUserLanguageName(interaction), {
			timeZone: entry.name.replaceAll(' ', '_'),
			dateStyle: 'short',
			timeStyle: 'medium'
		});
		const content = resolveUserKey(interaction, Root.ViewContent, { tz: entry.name, time: dtf.format() });
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}
}

function createNameOption() {
	return applyLocalizedBuilder(new SlashCommandStringOption(), Root.OptionsName)
		.setMinLength(MinimumLength)
		.setMaxLength(MaximumLength)
		.setRequired(true)
		.setAutocomplete(true);
}

type AutoCompleteOptions = AutocompleteInteractionArguments<Options>;

interface Options {
	name: string;
}
