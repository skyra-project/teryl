import { escapeInlineBlock } from '#lib/common/escape';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { Command, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, resolveKey, resolveUserKey } from '@skyra/http-framework-i18n';
import { MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.Choice.RootName, LanguageKeys.Commands.Choice.RootDescription) //
		.addStringOption((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.Choice.OptionsValues).setMinLength(3).setRequired(true))
)
export class UserCommand extends Command {
	public override chatInputRun(interaction: Command.ChatInputInteraction, args: Options) {
		const possibles = args.values.split(/ +/);
		if (possibles.length === 1) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.Choice.TooFewOptions);
			return interaction.sendMessage({ content, flags: MessageFlags.Ephemeral });
		}

		if (possibles.length !== new Set(possibles).size) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.Choice.DuplicatedOptions);
			return interaction.sendMessage({ content, flags: MessageFlags.Ephemeral });
		}

		const position = Math.floor(Math.random() * possibles.length);
		const content = resolveKey(interaction, LanguageKeys.Commands.Choice.Result, { value: escapeInlineBlock(possibles[position]) });
		return interaction.sendMessage({ content });
	}
}

interface Options {
	values: string;
}
