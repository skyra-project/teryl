import { bitHas } from '#lib/common/bits';
import { getDiscordEmojiData, getDiscordEmojiUrl, getTwemojiId, getTwemojiUrl, type DiscordEmoji } from '#lib/common/emoji';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { err, ok, Result } from '@sapphire/result';
import { isNullish, isNullishOrEmpty, isNullishOrZero, type Nullish } from '@sapphire/utilities';
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
		if (!bitHas(BigInt(interaction.app_permissions ?? 0n), PermissionFlagsBits.ManageEmojisAndStickers)) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.CreateEmoji.MissingPermissions);
			return this.message({ content, flags: MessageFlags.Ephemeral });
		}

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

		return this.sharedUpload(interaction, this.sanitizeName(file.filename), this.getOptimalUrl(file));
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
		const validationResult = this.parseContentLength(response.headers.get('Content-Length')) //
			.andThen(() => this.parseContentType(response.headers.get('Content-Type')));

		return validationResult.match({
			ok: (contentType) => this.performUpload(interaction, response, name, contentType),
			err: (error) => this.updateResponse({ content: resolveUserKey(interaction, error) })
		});
	}

	private async performUpload(interaction: Command.Interaction, response: Response, name: string, contentType: string) {
		const buffer = await response.arrayBuffer();
		const body: RESTPostAPIGuildEmojiJSONBody = {
			name,
			image: `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`
		};
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
}

type Options = MakeArguments<{
	emoji: 'string';
	file: 'attachment';
}>;
