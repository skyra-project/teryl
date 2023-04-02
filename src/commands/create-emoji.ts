import { bitHas } from '#lib/common/bits';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import {
	EmojiSource,
	getDiscordEmojiData,
	getDiscordEmojiUrl,
	getEmojiId,
	getEmojiUrl,
	getSanitizedEmojiName,
	type DiscordEmoji
} from '#lib/utilities/emoji';
import { DiscordAPIError, HTTPError } from '@discordjs/rest';
import { err, ok, Result } from '@sapphire/result';
import { isNullish, isNullishOrEmpty, isNullishOrZero, type Nullish } from '@sapphire/utilities';
import { Command, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, createSelectMenuChoiceName, resolveKey, resolveUserKey } from '@skyra/http-framework-i18n';
import { safeTimedFetch } from '@skyra/safe-fetch';
import {
	MessageFlags,
	PermissionFlagsBits,
	RESTJSONErrorCodes,
	Routes,
	type APIAttachment,
	type RESTPostAPIGuildEmojiJSONBody,
	type RESTPostAPIGuildEmojiResult
} from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.CreateEmoji;
const EmojiRoot = LanguageKeys.Commands.Emoji;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription)
		.addStringOption((builder) => applyLocalizedBuilder(builder, Root.OptionsEmoji))
		.addAttachmentOption((builder) => applyLocalizedBuilder(builder, Root.OptionsFile))
		.addStringOption((builder) => applyLocalizedBuilder(builder, Root.OptionsName))
		.addStringOption((builder) =>
			applyLocalizedBuilder(builder, EmojiRoot.OptionsVariant).setChoices(
				createSelectMenuChoiceName(EmojiRoot.OptionsVariantApple, { value: EmojiSource.Apple }),
				createSelectMenuChoiceName(EmojiRoot.OptionsVariantFacebook, { value: EmojiSource.Facebook }),
				createSelectMenuChoiceName(EmojiRoot.OptionsVariantGoogle, { value: EmojiSource.Google }),
				createSelectMenuChoiceName(EmojiRoot.OptionsVariantMicrosoft, { value: EmojiSource.Microsoft }),
				createSelectMenuChoiceName(EmojiRoot.OptionsVariantTwitter, { value: EmojiSource.Twitter }),
				createSelectMenuChoiceName(EmojiRoot.OptionsVariantWhatsApp, { value: EmojiSource.WhatsApp })
			)
		)
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers)
)
export class UserCommand extends Command {
	public override chatInputRun(interaction: Command.ChatInputInteraction, args: Options) {
		if (!bitHas(interaction.applicationPermissions ?? 0n, PermissionFlagsBits.ManageEmojisAndStickers)) {
			const content = resolveUserKey(interaction, Root.MissingPermissions);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		if (args.name && !UserCommand.NameValidatorRegExp.test(args.name)) {
			const content = resolveUserKey(interaction, Root.InvalidName);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		// !Emoji:
		if (isNullish(args.emoji)) {
			// !Emoji && !File:
			if (isNullish(args.file)) {
				const content = resolveUserKey(interaction, Root.None);
				return interaction.reply({ content, flags: MessageFlags.Ephemeral });
			}

			// !Emoji && File:
			return this.uploadFile(interaction, args.file, args.name);
		}

		// Emoji && !File:
		if (isNullish(args.file)) return this.uploadEmoji(interaction, args.emoji, args.name, args.variant);

		// Emoji && File
		const content = resolveUserKey(interaction, Root.Duplicated);
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	private uploadEmoji(interaction: Command.ChatInputInteraction, emoji: string, name?: string, variant?: EmojiSource) {
		const data = getDiscordEmojiData(emoji);
		return isNullish(data) ? this.uploadBuiltInEmoji(interaction, emoji, name, variant) : this.uploadDiscordEmoji(interaction, data, name);
	}

	private uploadBuiltInEmoji(interaction: Command.ChatInputInteraction, emoji: string, name?: string, variant?: EmojiSource) {
		const id = getEmojiId(emoji);
		const url = getEmojiUrl(id, variant ?? EmojiSource.Twitter);
		if (isNullishOrEmpty(url)) {
			const content = resolveUserKey(interaction, EmojiRoot.InvalidEmoji);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		name ??= getSanitizedEmojiName(id)!;
		if (name.length > 32) name = name.slice(0, 32);
		return this.sharedUpload(interaction, name, url);
	}

	private uploadDiscordEmoji(interaction: Command.ChatInputInteraction, emoji: DiscordEmoji, name?: string) {
		return this.sharedUpload(interaction, name ?? emoji.name.replace(/~\d+/, ''), getDiscordEmojiUrl(emoji));
	}

	private uploadFile(interaction: Command.ChatInputInteraction, file: APIAttachment, name?: string) {
		if (isNullishOrZero(file.width) || isNullishOrZero(file.height)) {
			const content = resolveUserKey(interaction, Root.Duplicated);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		return this.sharedUpload(interaction, this.sanitizeName(name ?? file.filename), this.getOptimalUrl(file));
	}

	private async sharedUpload(interaction: Command.ChatInputInteraction, name: string, url: string) {
		const deferred = await interaction.defer({ flags: MessageFlags.Ephemeral });

		const downloadResult = await safeTimedFetch(url, 5000);
		if (downloadResult.isErr()) {
			const content = resolveUserKey(interaction, Root.FailedToDownload);
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
		const reason = resolveKey(interaction, Root.UploadedBy, { user: interaction.member!.user });
		const uploadResult = await Result.fromAsync(
			() => this.container.rest.post(Routes.guildEmojis(interaction.guild_id!), { body, reason }) as Promise<RESTPostAPIGuildEmojiResult>
		);

		return uploadResult
			.map((data) => `<${data.animated ? 'a' : ''}:${data.name}:${data.id}>`)
			.match({
				ok: (emoji) => resolveUserKey(interaction, Root.Uploaded, { emoji }),
				err: (error) => this.getUploadError(interaction, error)
			});
	}

	private getUploadError(interaction: Command.ChatInputInteraction, error: unknown) {
		if (error instanceof HTTPError) {
			this.container.logger.error(error);
			return resolveUserKey(interaction, Root.FailedToUploadDiscordDown);
		}

		if (error instanceof DiscordAPIError) {
			switch (error.code as number) {
				case RESTJSONErrorCodes.MissingPermissions:
					return resolveUserKey(interaction, Root.FailedToUploadMissingPermissions);
				case RESTJSONErrorCodes.InvalidFormBodyOrContentType:
					return resolveUserKey(interaction, Root.FailedToUploadInvalidBody);
				case RESTJSONErrorCodes.MaximumNumberOfEmojisReached:
					return resolveUserKey(interaction, Root.FailedToUploadMaximumEmojis);
				case RESTJSONErrorCodes.MaximumNumberOfAnimatedEmojisReached:
					return resolveUserKey(interaction, Root.FailedToUploadMaximumAnimatedEmojis);
			}
		}

		this.container.logger.error(error);
		return resolveUserKey(interaction, Root.FailedToUpload);
	}

	private sanitizeName(name: string) {
		return name
			.split('.', 1)[0]
			.replaceAll(/[^\d\w]/g, '_')
			.padEnd(2, '_')
			.slice(0, 32);
	}

	private getOptimalUrl(file: NonNullable<Options['file']>) {
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
		if (isNullishOrEmpty(size)) return err(Root.ContentLengthMissing);

		const parsed = Number(size);

		// Edge case (should never happen): error on invalid (NaN, non-integer, negative) Content-Length:
		if (!Number.isSafeInteger(parsed) || parsed < 0) return err(Root.ContentLengthInvalid);

		// `parsed` is in bytes, maximum upload size is 256 kilobytes. Error if Content-Length exceeds the limit:
		if (parsed > 256000) return err(Root.ContentLengthTooBig);

		return ok();
	}

	private parseContentType(type: string | Nullish) {
		// Edge case (should never happen): error on missing Content-Type:
		if (isNullishOrEmpty(type)) return err(Root.ContentTypeMissing);

		switch (type) {
			case 'image/png':
			case 'image/jpg':
			case 'image/jpeg':
			case 'image/gif':
			case 'image/webp':
				return ok(type);
		}

		return err(Root.ContentTypeUnsupported);
	}

	private static readonly NameValidatorRegExp = /^[0-9a-zA-Z_]{2,32}$/;
}

interface Options {
	emoji: string;
	file?: APIAttachment;
	name?: string;
	variant?: EmojiSource;
}
