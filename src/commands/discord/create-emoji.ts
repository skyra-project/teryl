import { getDiscordEmojiData, getDiscordEmojiUrl, getTwemojiId, getTwemojiUrl, type DiscordEmoji } from '#lib/common/emoji';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { Result } from '@sapphire/result';
import { isNullish, isNullishOrZero } from '@sapphire/utilities';
import { Command, RegisterCommand, type MakeArguments } from '@skyra/http-framework';
import { applyLocalizedBuilder, resolveKey, resolveUserKey } from '@skyra/http-framework-i18n';
import {
	MessageFlags,
	PermissionFlagsBits,
	Routes,
	type RESTPostAPIGuildEmojiJSONBody,
	type RESTPostAPIGuildEmojiResult
} from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.CreateEmoji.RootName, LanguageKeys.Commands.CreateEmoji.RootDescription)
		.addStringOption((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.CreateEmoji.OptionsEmoji))
		.addAttachmentOption((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.CreateEmoji.OptionsFile))
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers)
)
export class UserCommand extends Command {
	public override chatInputRun(interaction: Command.Interaction, args: Options): Command.Response {
		// TODO: Check `interaction.app_permissions`

		// !Emoji:
		if (isNullish(args.emoji)) {
			// !Emoji && !File:
			if (isNullish(args.file)) {
				const content = resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.None);
				return this.message({ content, flags: MessageFlags.Ephemeral });
			}

			// !Emoji && File:
			return this.uploadFile(interaction, args.file);
		}

		// Emoji && !File:
		if (isNullish(args.file)) return this.uploadEmoji(interaction, args.emoji);

		// Emoji && File
		const content = resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.Duplicated);
		return this.message({ content, flags: MessageFlags.Ephemeral });
	}

	private uploadEmoji(interaction: Command.Interaction, emoji: Options['emoji']): Command.Response {
		const data = getDiscordEmojiData(emoji);
		return isNullish(data) ? this.uploadBuiltInEmoji(interaction, emoji) : this.uploadDiscordEmoji(interaction, data);
	}

	private uploadBuiltInEmoji(interaction: Command.Interaction, emoji: string): Command.Response {
		return this.sharedUpload(interaction, getTwemojiId(emoji), getTwemojiUrl(emoji));
	}

	private uploadDiscordEmoji(interaction: Command.Interaction, emoji: DiscordEmoji): Command.Response {
		return this.sharedUpload(interaction, emoji.name, getDiscordEmojiUrl(emoji));
	}

	private uploadFile(interaction: Command.Interaction, file: Options['file']): Command.Response {
		if (isNullishOrZero(file.width) || isNullishOrZero(file.height)) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.Duplicated);
			return this.message({ content, flags: MessageFlags.Ephemeral });
		}

		// TODO: Sanitize name
		return this.sharedUpload(interaction, file.filename, file.url);
	}

	private async *sharedUpload(interaction: Command.Interaction, name: string, url: string): Command.AsyncGeneratorResponse {
		yield this.defer({ flags: MessageFlags.Ephemeral });

		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 5000);
		const downloadResult = await Result.fromAsync(() => fetch(url, { signal: controller.signal }));
		clearTimeout(timer);

		if (downloadResult.isErr() || downloadResult.isOkAnd((response) => !response.ok)) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.FailedToDownload);
			return this.updateResponse({ content });
		}

		const response = downloadResult.unwrap();
		// TODO: Handle max size

		const buffer = await response.arrayBuffer();
		const body: RESTPostAPIGuildEmojiJSONBody = { name, image: `data:image/jpg;base64,${Buffer.from(buffer).toString('base64')}` };
		const reason = resolveKey(interaction, LanguageKeys.Commands.CreateEmoji.UploadedBy, { user: interaction.member!.user });
		const uploadResult = await Result.fromAsync(
			() => this.container.rest.post(Routes.guildEmojis(interaction.guild_id!), { body, reason }) as Promise<RESTPostAPIGuildEmojiResult>
		);

		const content = uploadResult
			.map((data) => `<${data.animated ? 'a' : ''}:${data.name}:${data.id}>`)
			.match({
				ok: (emoji) => resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.Uploaded, { emoji }),
				// TODO: Handle error codes
				err: () => resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.FailedToUpload)
			});
		return this.updateResponse({ content });
	}
}

type Options = MakeArguments<{
	emoji: 'string';
	file: 'attachment';
}>;
