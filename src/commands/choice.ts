import { escapeInlineCode } from '#lib/common/escape';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { Command, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, resolveKey, resolveUserKey } from '@skyra/http-framework-i18n';
import { ApplicationIntegrationType, InteractionContextType, MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.Choice.RootName, LanguageKeys.Commands.Choice.RootDescription) //
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
		.addStringOption((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.Choice.OptionsValues).setMinLength(3).setRequired(true))
)
export class UserCommand extends Command {
	public override chatInputRun(interaction: Command.ChatInputInteraction, args: Options) {
		const possibles = args.values
			.split(/[,|-]+/)
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
		if (possibles.length === 1) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.Choice.TooFewOptions);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		if (possibles.length !== new Set(possibles).size) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.Choice.DuplicatedOptions);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const position = Math.floor(Math.random() * possibles.length);
		const content = resolveKey(interaction, LanguageKeys.Commands.Choice.Result, { value: escapeInlineCode(possibles[position]) });
		return interaction.reply({ content });
	}
}

interface Options {
	values: string;
}
