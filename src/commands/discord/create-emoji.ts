import { bitHas } from '#lib/common/bits';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { getDiscordEmojiData, getDiscordEmojiUrl, getTwemojiId, getTwemojiUrl, type DiscordEmoji } from '#lib/utilities/emoji';
import { getUnicodeEmojiName } from '#lib/utilities/unicode';
import { DiscordAPIError, HTTPError } from '@discordjs/rest';
import { err, ok, Result } from '@sapphire/result';
import { isNullish, isNullishOrEmpty, isNullishOrZero, type Nullish } from '@sapphire/utilities';
import { Command, RegisterCommand, type MakeArguments } from '@skyra/http-framework';
import { applyLocalizedBuilder, resolveKey, resolveUserKey } from '@skyra/http-framework-i18n';
import { safeTimedFetch } from '@skyra/safe-fetch';
import {
	APIAttachment,
	MessageFlags,
	PermissionFlagsBits,
	RESTJSONErrorCodes,
	Routes,
	type RESTPostAPIGuildEmojiJSONBody,
	type RESTPostAPIGuildEmojiResult
} from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.CreateEmoji.RootName, LanguageKeys.Commands.CreateEmoji.RootDescription)
		.addStringOption((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.CreateEmoji.OptionsEmoji))
		.addAttachmentOption((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.CreateEmoji.OptionsFile))
		.addStringOption((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.CreateEmoji.OptionsName))
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers)
)
export class UserCommand extends Command {
	public override chatInputRun(interaction: Command.ChatInputInteraction, args: Options) {
		if (!bitHas(interaction.applicationPermissions ?? 0n, PermissionFlagsBits.ManageEmojisAndStickers)) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.MissingPermissions);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		if (args.name && !UserCommand.NameValidatorRegExp.test(args.name)) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.InvalidName);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		// !Emoji:
		if (isNullish(args.emoji)) {
			// !Emoji && !File:
			if (isNullish(args.file)) {
				const content = resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.None);
				return interaction.reply({ content, flags: MessageFlags.Ephemeral });
			}

			// !Emoji && File:
			return this.uploadFile(interaction, args.file, args.name);
		}

		// Emoji && !File:
		if (isNullish(args.file)) return this.uploadEmoji(interaction, args.emoji, args.name);

		// Emoji && File
		const content = resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.Duplicated);
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	private uploadEmoji(interaction: Command.ChatInputInteraction, emoji: string, name?: string) {
		const data = getDiscordEmojiData(emoji);
		return isNullish(data) ? this.uploadBuiltInEmoji(interaction, emoji, name) : this.uploadDiscordEmoji(interaction, data, name);
	}

	private uploadBuiltInEmoji(interaction: Command.ChatInputInteraction, emoji: string, name?: string) {
		return this.sharedUpload(interaction, name ?? getUnicodeEmojiName(emoji) ?? getTwemojiId(emoji), getTwemojiUrl(emoji));
	}

	private uploadDiscordEmoji(interaction: Command.ChatInputInteraction, emoji: DiscordEmoji, name?: string) {
		return this.sharedUpload(interaction, name ?? emoji.name.replace(/~\d+/, ''), getDiscordEmojiUrl(emoji));
	}

	private uploadFile(interaction: Command.ChatInputInteraction, file: APIAttachment, name?: string) {
		if (isNullishOrZero(file.width) || isNullishOrZero(file.height)) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.Duplicated);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		return this.sharedUpload(interaction, this.sanitizeName(name ?? file.filename), this.getOptimalUrl(file));
	}

	private async sharedUpload(interaction: Command.ChatInputInteraction, name: string, url: string) {
		const deferred = await interaction.defer({ flags: MessageFlags.Ephemeral });

		const downloadResult = await safeTimedFetch(url, 5000);
		if (downloadResult.isErr()) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.FailedToDownload);
			return deferred.update({ content });
		}

		const response = downloadResult.unwrap();
		const validationResult = this.parseContentLength(response.headers.get('Content-Length')) //
			.andThen(() => this.parseContentType(response.headers.get('Content-Type')));

		const content = await validationResult.match({
			ok: (contentType) => this.performUpload(interaction, response, name, contentType),
			err: (error) => resolveUserKey(interaction, error)
		});
		return deferred.update({ content });
	}

	private async performUpload(interaction: Command.ChatInputInteraction, response: Response, name: string, contentType: string) {
		const buffer = await response.arrayBuffer();
		const body: RESTPostAPIGuildEmojiJSONBody = {
			name,
			image: `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`
		};
		const reason = resolveKey(interaction, LanguageKeys.Commands.CreateEmoji.UploadedBy, { user: interaction.member!.user });
		const uploadResult = await Result.fromAsync(
			() => this.container.rest.post(Routes.guildEmojis(interaction.guild_id!), { body, reason }) as Promise<RESTPostAPIGuildEmojiResult>
		);

		return uploadResult
			.map((data) => `<${data.animated ? 'a' : ''}:${data.name}:${data.id}>`)
			.match({
				ok: (emoji) => resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.Uploaded, { emoji }),
				err: (error) => this.getUploadError(interaction, error)
			});
	}

	private getUploadError(interaction: Command.ChatInputInteraction, error: unknown) {
		if (error instanceof HTTPError) {
			this.container.logger.error(error);
			return resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.FailedToUploadDiscordDown);
		}

		if (error instanceof DiscordAPIError) {
			switch (error.code as number) {
				case RESTJSONErrorCodes.MissingPermissions:
					return resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.FailedToUploadMissingPermissions);
				case RESTJSONErrorCodes.InvalidFormBodyOrContentType:
					return resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.FailedToUploadInvalidBody);
				case RESTJSONErrorCodes.MaximumNumberOfEmojisReached:
					return resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.FailedToUploadMaximumEmojis);
				case RESTJSONErrorCodes.MaximumNumberOfAnimatedEmojisReached:
					return resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.FailedToUploadMaximumAnimatedEmojis);
			}
		}

		this.container.logger.error(error);
		return resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.FailedToUpload);
	}

	private sanitizeName(name: string) {
		return name
			.split('.', 1)[0]
			.replaceAll(/[^\d\w]/g, '_')
			.padEnd(2, '_')
			.slice(0, 32);
	}

	private getOptimalUrl(file: Options['file']) {
		const width = file.width!;
		const height = file.height!;

		if (width <= 128 && height <= 128) return file.url;

		const url = new URL(file.url);
		if (width === height) {
			url.searchParams.append('width', '128');
			url.searchParams.append('height', '128');
		} else if (width > height) {
			url.searchParams.append('width', '128');
			url.searchParams.append('height', Math.ceil((height * 128) / width).toString());
		} else {
			url.searchParams.append('width', Math.ceil((width * 128) / height).toString());
			url.searchParams.append('height', '128');
		}

		return url.href;
	}

	private parseContentLength(size: string | Nullish) {
		// Edge case (should never happen): error on missing Content-Length:
		if (isNullishOrEmpty(size)) return err(LanguageKeys.Commands.CreateEmoji.ContentLengthMissing);

		const parsed = Number(size);

		// Edge case (should never happen): error on invalid (NaN, non-integer, negative) Content-Length:
		if (!Number.isSafeInteger(parsed) || parsed < 0) return err(LanguageKeys.Commands.CreateEmoji.ContentLengthInvalid);

		// `parsed` is in bytes, maximum upload size is 256 kilobytes. Error if Content-Length exceeds the limit:
		if (parsed > 256000) return err(LanguageKeys.Commands.CreateEmoji.ContentLengthTooBig);

		return ok();
	}

	private parseContentType(type: string | Nullish) {
		// Edge case (should never happen): error on missing Content-Type:
		if (isNullishOrEmpty(type)) return err(LanguageKeys.Commands.CreateEmoji.ContentTypeMissing);

		switch (type) {
			case 'image/png':
			case 'image/jpg':
			case 'image/jpeg':
			case 'image/gif':
			case 'image/webp':
				return ok(type);
		}

		return err(LanguageKeys.Commands.CreateEmoji.ContentTypeUnsupported);
	}

	private static readonly NameValidatorRegExp = /^[0-9a-zA-Z_]{2,32}$/;
}

type Options = MakeArguments<{
	emoji: 'string';
	file: 'attachment';
	name: 'string';
}>;
