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
import { Transformer } from '@napi-rs/image';
import { Result, err, ok } from '@sapphire/result';
import { isNullish, isNullishOrEmpty, isNullishOrZero, tryParseURL, type Nullish } from '@sapphire/utilities';
import { Command, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, createSelectMenuChoiceName, resolveKey, resolveUserKey } from '@skyra/http-framework-i18n';
import { safeTimedFetch, type FetchResult } from '@skyra/safe-fetch';
import {
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
	PermissionFlagsBits,
	RESTJSONErrorCodes,
	Routes,
	type APIAttachment,
	type RESTPostAPIGuildEmojiJSONBody,
	type RESTPostAPIGuildEmojiResult,
	type Snowflake
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
				createSelectMenuChoiceName(EmojiRoot.OptionsVariantMicrosoftFluent, { value: EmojiSource.MicrosoftFluent }),
				createSelectMenuChoiceName(EmojiRoot.OptionsVariantSamsung, { value: EmojiSource.Samsung }),
				createSelectMenuChoiceName(EmojiRoot.OptionsVariantTwitter, { value: EmojiSource.Twitter }),
				createSelectMenuChoiceName(EmojiRoot.OptionsVariantWhatsApp, { value: EmojiSource.WhatsApp })
			)
		)
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions)
)
export class UserCommand extends Command {
	private readonly SnowflakeRegExp = /^\d{17,20}$/;
	private readonly UrlPathNameRegExp = /^\/emojis\/(\d{17,20})\.(?:webp|png|gif|jpe?g)$/;

	public override chatInputRun(interaction: Command.ChatInputInteraction, args: Options) {
		if (!bitHas(interaction.applicationPermissions ?? 0n, PermissionFlagsBits.ManageGuildExpressions)) {
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
		// Upload by snowflake:
		if (this.SnowflakeRegExp.test(emoji)) return this.uploadDiscordEmojiId(interaction, emoji, name);

		// Upload by URL:
		const url = tryParseURL(emoji);
		if (url !== null) return this.uploadURL(interaction, url, name);

		const data = getDiscordEmojiData(emoji);
		return isNullish(data) ? this.uploadBuiltInEmoji(interaction, emoji, name, variant) : this.uploadDiscordEmoji(interaction, data, name);
	}

	private uploadURL(interaction: Command.ChatInputInteraction, url: URL, name?: string) {
		let result: RegExpExecArray | null;
		// If the URL is not from Discord's CDN, or the pathname does not match the emoji pattern, error:
		if (url.host !== 'cdn.discordapp.com' || (result = this.UrlPathNameRegExp.exec(url.pathname)) === null) {
			const content = resolveUserKey(interaction, Root.InvalidDiscordURL);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		return this.uploadDiscordEmojiId(interaction, result[1], name);
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
		return this.sharedUpload(interaction, name, [url]);
	}

	private uploadDiscordEmojiId(interaction: Command.ChatInputInteraction, id: Snowflake, name?: string) {
		// Try to download an animated emoji, if it fails (code 415), try to download a non-animated one:
		return this.sharedUpload(interaction, name ?? id, [
			getDiscordEmojiUrl({ id, name: '', animated: true }),
			getDiscordEmojiUrl({ id, name: '', animated: false })
		]);
	}

	private uploadDiscordEmoji(interaction: Command.ChatInputInteraction, emoji: DiscordEmoji, name?: string) {
		return this.sharedUpload(interaction, name ?? emoji.name.replace(/~\d+/, ''), [getDiscordEmojiUrl(emoji)]);
	}

	private uploadFile(interaction: Command.ChatInputInteraction, file: APIAttachment, name?: string) {
		if (isNullishOrZero(file.width) || isNullishOrZero(file.height)) {
			const content = resolveUserKey(interaction, Root.NotAnImage);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		return this.sharedUpload(interaction, this.sanitizeName(name ?? file.filename), [this.getOptimalUrl(file)]);
	}

	private async sharedUpload(interaction: Command.ChatInputInteraction, name: string, urls: readonly string[]) {
		const deferred = await interaction.defer({ flags: MessageFlags.Ephemeral });

		// Iterate over the possible URLs until it finds a valid emoji:
		let downloadResult!: FetchResult<Response>;
		for (const url of urls) {
			downloadResult = await safeTimedFetch(url, 5000);
			if (downloadResult.isOk()) break;
		}

		if (downloadResult.isErr()) {
			const content = resolveUserKey(interaction, Root.FailedToDownload);
			return deferred.update({ content });
		}

		const response = downloadResult.unwrap();
		const contentTypeResult = this.parseContentLength(response.headers.get('Content-Length')) //
			.andThen(() => this.parseContentType(response.headers.get('Content-Type')));
		if (contentTypeResult.isErr()) {
			const content = resolveUserKey(interaction, contentTypeResult.unwrapErr());
			return deferred.update({ content });
		}

		const imageResult = await this.maybeCompressImage(Buffer.from(await response.arrayBuffer()), contentTypeResult.unwrap());
		const content = await imageResult.match({
			ok: (data) => this.performUpload(interaction, data.image, name, data.contentType),
			err: (error) => resolveUserKey(interaction, error)
		});
		return deferred.update({ content });
	}

	private async performUpload(interaction: Command.ChatInputInteraction, buffer: Buffer, name: string, contentType: string) {
		const body: RESTPostAPIGuildEmojiJSONBody = {
			name,
			image: `data:${contentType};base64,${buffer.toString('base64')}`
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
		return name.split('.', 1)[0].replaceAll(/[^\w]/g, '_').padEnd(2, '_').slice(0, 32);
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

		return ok(parsed);
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
				return ok(type as ContentType);
		}

		return err(Root.ContentTypeUnsupported);
	}

	private async maybeCompressImage(original: Buffer, contentType: ContentType) {
		if (original.byteLength <= UserCommand.MaximumUploadSize) return ok({ image: original, contentType });
		if (contentType === 'image/gif') return err(Root.ContentLengthTooBig);

		const image = await new Transformer(original).fastResize({ width: 128, height: 128, fit: 2 }).webp(100);
		return image.byteLength > UserCommand.MaximumUploadSize ? err(Root.ContentLengthTooBig) : ok({ image, contentType: 'image/webp' });
	}

	private static readonly NameValidatorRegExp = /^\w{2,32}$/;
	private static readonly MaximumUploadSize = 256 * 1024;
}

interface Options {
	emoji: string;
	file?: APIAttachment;
	name?: string;
	variant?: EmojiSource;
}

type ContentType = 'image/png' | 'image/jpg' | 'image/jpeg' | 'image/gif' | 'image/webp';
