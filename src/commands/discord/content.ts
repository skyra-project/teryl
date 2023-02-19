import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { codeBlock } from '@discordjs/builders';
import type { RawFile } from '@discordjs/rest';
import { Command, RegisterMessageCommand, RegisterUserCommand, type TransformedArguments } from '@skyra/http-framework';
import { applyNameLocalizedBuilder } from '@skyra/http-framework-i18n';
import { MessageFlags } from 'discord-api-types/v10';

export class UserCommand extends Command {
	@RegisterMessageCommand((builder) => applyNameLocalizedBuilder(builder, LanguageKeys.Commands.Content.MessageJsonName))
	public message(interaction: Command.MessageInteraction, options: TransformedArguments.Message) {
		return this.shared(interaction, options.message, options.message.id);
	}

	@RegisterUserCommand((builder) => applyNameLocalizedBuilder(builder, LanguageKeys.Commands.Content.UserJsonName))
	public user(interaction: Command.UserInteraction, options: TransformedArguments.User) {
		const data = options.member ? { ...options.member, user: options.user } : options.user;
		return this.shared(interaction, data, options.user.id);
	}

	private async shared(interaction: Command.MessageInteraction | Command.UserInteraction, data: object, id: string) {
		const json = JSON.stringify(data, null, '\t');
		if (json.length < 1988) return interaction.reply({ content: codeBlock('json', json), flags: MessageFlags.Ephemeral });

		const response = await interaction.defer({ flags: MessageFlags.Ephemeral });
		const file = { name: `${id}.json`, data: Buffer.from(json, 'utf8'), contentType: 'application/json' } satisfies RawFile;
		return response.update({ files: [file] });
	}
}
