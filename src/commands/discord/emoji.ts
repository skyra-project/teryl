import { getDiscordEmojiData, getDiscordEmojiUrl, getTwemojiId, getTwemojiUrl, type DiscordEmoji } from '#lib/common/emoji';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { safeTimedFetch } from '#lib/utilities/fetch';
import type { RawFile } from '@discordjs/rest';
import { Time } from '@sapphire/time-utilities';
import { isNullish } from '@sapphire/utilities';
import { Command, MakeArguments, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, resolveKey, resolveUserKey } from '@skyra/http-framework-i18n';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.Emoji.RootName, LanguageKeys.Commands.Emoji.RootDescription) //
		.addStringOption((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.Emoji.OptionsEmoji).setRequired(true))
)
export class UserCommand extends Command {
	public override chatInputRun(interaction: Command.ChatInputInteraction, args: Options) {
		const data = getDiscordEmojiData(args.emoji);
		return isNullish(data) ? this.getBuiltInResponse(interaction, args.emoji) : this.getDiscordResponse(interaction, data);
	}

	private async getBuiltInResponse(interaction: Command.ChatInputInteraction, emoji: string) {
		const deferred = await interaction.defer();

		const id = getTwemojiId(emoji);
		const attachment = await this.getAttachment(`${id}.png`, getTwemojiUrl(emoji));
		const response = attachment.match({
			ok: (data) => ({ content: resolveKey(interaction, LanguageKeys.Commands.Emoji.TwemojiContent, { emoji, id }), files: [data] }),
			err: () => ({ content: resolveUserKey(interaction, LanguageKeys.Commands.Emoji.InvalidTwemoji) })
		});
		return deferred.update(response);
	}

	private async getDiscordResponse(interaction: Command.ChatInputInteraction, emoji: DiscordEmoji) {
		const deferred = await interaction.defer();

		const attachment = await this.getAttachment(`${emoji.name}.${emoji.animated ? 'gif' : 'png'}`, getDiscordEmojiUrl(emoji));
		const response = attachment.match({
			ok: (data) => ({ content: resolveKey(interaction, LanguageKeys.Commands.Emoji.DiscordEmojiContent, { emoji }), files: [data] }),
			err: () => ({ content: resolveUserKey(interaction, LanguageKeys.Commands.Emoji.InvalidDiscordEmoji) })
		});
		return deferred.update(response);
	}

	private async getAttachment(name: string, url: string) {
		const result = await safeTimedFetch(url, Time.Second * 5);

		return result
			.map(async (result): Promise<RawFile> => {
				const blob = await result.blob();
				return { name, data: Buffer.from(await blob.arrayBuffer()), contentType: blob.type };
			})
			.intoPromise();
	}
}

type Options = MakeArguments<{
	emoji: 'string';
}>;
