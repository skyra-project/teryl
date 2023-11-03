import { escapeCodeBlock } from '#lib/common/escape';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { codeBlock, SlashCommandStringOption, SlashCommandUserOption } from '@discordjs/builders';
import type { RawFile } from '@discordjs/rest';
import {
	Command,
	RegisterCommand,
	RegisterMessageCommand,
	RegisterSubCommand,
	RegisterUserCommand,
	type TransformedArguments
} from '@skyra/http-framework';
import { applyLocalizedBuilder, applyNameLocalizedBuilder, resolveUserKey } from '@skyra/http-framework-i18n';
import { type APIMessage, MessageFlags, Routes } from 'discord-api-types/v10';
import { isNullishOrEmpty } from '@sapphire/utilities';
import { Result } from '@sapphire/result';

@RegisterCommand((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.Content.RootName, LanguageKeys.Commands.Content.RootDescription))
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

	// Slash commands:
	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Content.User).addUserOption(createUserOption().setRequired(true))
	)
	public async slashUser(interaction: Command.ChatInputInteraction, options: UserOptions) {
		if (isNullishOrEmpty(options.user)) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.Content.UserMissingOptions);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}
		const data = options.user.member ? { ...options.user.member, user: options.user.user } : options.user.user;
		return this.shared(interaction, data, options.user.user.id);
	}

	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Content.Message).addStringOption(createMessageIdOption().setRequired(true))
	)
	public async slashMessage(interaction: Command.ChatInputInteraction, options: MessageOptions) {
		if (isNullishOrEmpty(options.id)) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.Content.MessageMissingOptions);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const result = await Result.fromAsync(this.container.rest.get(Routes.channelMessage(interaction.channel.id, options.id)));
		if (result.isErr()) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.Content.MessageInvalidOptions);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const message = result.unwrap() as APIMessage;
		return this.shared(interaction, message, message.id);
	}

	// Shared
	private async shared(interaction: Command.MessageInteraction | Command.UserInteraction | Command.ChatInputInteraction, data: object, id: string) {
		const json = JSON.stringify(data, null, '\t');
		if (json.length < 1988) return interaction.reply({ content: codeBlock('json', escapeCodeBlock(json)), flags: MessageFlags.Ephemeral });

		const response = await interaction.defer({ flags: MessageFlags.Ephemeral });
		const file = { name: `${id}.json`, data: Buffer.from(json, 'utf8'), contentType: 'application/json' } satisfies RawFile;
		return response.update({ files: [file] });
	}
}
function createMessageIdOption() {
	return applyLocalizedBuilder(new SlashCommandStringOption(), LanguageKeys.Commands.Content.OptionsMessageId);
}
function createUserOption() {
	return applyLocalizedBuilder(new SlashCommandUserOption(), LanguageKeys.Commands.Content.OptionsUser);
}
interface MessageOptions {
	id: string;
}
interface UserOptions {
	user: TransformedArguments.User;
}
