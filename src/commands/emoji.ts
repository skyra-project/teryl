import { cut } from '#lib/common/strings';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { EmojiSource, getDiscordEmojiData, getDiscordEmojiUrl, getEmojiId, getEmojiName, getEmojiUrl, type DiscordEmoji } from '#lib/utilities/emoji';
import { ActionRowBuilder, EmbedBuilder, SelectMenuBuilder } from '@discordjs/builders';
import { Collection } from '@discordjs/collection';
import type { RawFile } from '@discordjs/rest';
import { Time } from '@sapphire/duration';
import { isNullish, isNullishOrEmpty } from '@sapphire/utilities';
import { Command, RegisterCommand, RegisterMessageCommand, type TransformedArguments } from '@skyra/http-framework';
import { applyLocalizedBuilder, applyNameLocalizedBuilder, createSelectMenuChoiceName, resolveKey, resolveUserKey } from '@skyra/http-framework-i18n';
import { safeTimedFetch } from '@skyra/safe-fetch';
import { MessageFlags } from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.Emoji;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription)
		.addStringOption((builder) => applyLocalizedBuilder(builder, Root.OptionsEmoji).setRequired(true))
		.addStringOption((builder) =>
			applyLocalizedBuilder(builder, Root.OptionsVariant).setChoices(
				createSelectMenuChoiceName(Root.OptionsVariantApple, { value: EmojiSource.Apple }),
				createSelectMenuChoiceName(Root.OptionsVariantFacebook, { value: EmojiSource.Facebook }),
				createSelectMenuChoiceName(Root.OptionsVariantGoogle, { value: EmojiSource.Google }),
				createSelectMenuChoiceName(Root.OptionsVariantMicrosoft, { value: EmojiSource.Microsoft }),
				createSelectMenuChoiceName(Root.OptionsVariantTwitter, { value: EmojiSource.Twitter }),
				createSelectMenuChoiceName(Root.OptionsVariantWhatsApp, { value: EmojiSource.WhatsApp })
			)
		)
)
export class UserCommand extends Command {
	public override chatInputRun(interaction: Command.ChatInputInteraction, args: Options) {
		const data = getDiscordEmojiData(args.emoji);
		return isNullish(data)
			? this.getBuiltInResponse(interaction, args.emoji, args.variant ?? EmojiSource.Twitter)
			: this.getDiscordResponse(interaction, data);
	}

	@RegisterMessageCommand((builder) => applyNameLocalizedBuilder(builder, Root.ExtractEmojisName))
	public onMessageContext(interaction: Command.MessageInteraction, options: TransformedArguments.Message) {
		if (isNullishOrEmpty(options.message.content)) {
			const content = resolveUserKey(interaction, Root.NoContent);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const emojis = new Collection<string, DiscordEmoji>();
		for (const match of options.message.content.matchAll(UserCommand.CustomEmojiRegExp)) {
			emojis.set(match.groups!.id, { id: match.groups!.id, name: match.groups!.name, animated: match.groups!.animated === 'a' });
			if (emojis.size === 25) break;
		}

		if (emojis.size === 0) {
			const content = resolveUserKey(interaction, Root.NoEmojis);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const first = emojis.first()!;
		const embed = new EmbedBuilder()
			.setDescription(resolveUserKey(interaction, Root.DiscordEmojiContent, { emoji: first }))
			.setThumbnail(getDiscordEmojiUrl(first))
			.setTimestamp();

		let row = undefined as undefined | ActionRowBuilder<SelectMenuBuilder>;
		if (emojis.size > 1) {
			row = new ActionRowBuilder();
			const select = new SelectMenuBuilder().setCustomId('emoji');

			let isDefault = true;
			for (const emoji of emojis.values()) {
				select.addOptions({
					label: cut(emoji.name, 25),
					value: `${emoji.id}.${emoji.name}.${emoji.animated ? '1' : '0'}`,
					default: isDefault,
					emoji
				});

				isDefault = false;
			}

			row.addComponents(select);
		}

		return interaction.reply({ embeds: [embed.toJSON()], components: row ? [row.toJSON()] : undefined, flags: MessageFlags.Ephemeral });
	}

	private async getBuiltInResponse(interaction: Command.ChatInputInteraction, emoji: string, variant: EmojiSource) {
		const id = getEmojiId(emoji);
		const url = getEmojiUrl(id, variant);
		if (isNullish(url)) {
			const content = resolveUserKey(interaction, Root.InvalidEmoji);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const name = getEmojiName(id)!;
		const deferred = await interaction.defer();
		const attachment = await this.getAttachment(`${id}.png`, url);
		const response = attachment.match({
			ok: (data) => ({ content: resolveKey(interaction, Root.EmojiContent, { id, name, emoji }), files: [data] }),
			err: () => ({ content: resolveUserKey(interaction, Root.UnsupportedEmoji) })
		});
		return deferred.update(response);
	}

	private async getDiscordResponse(interaction: Command.ChatInputInteraction, emoji: DiscordEmoji) {
		const deferred = await interaction.defer();

		const attachment = await this.getAttachment(`${emoji.name}.${emoji.animated ? 'gif' : 'png'}`, getDiscordEmojiUrl(emoji));
		const response = attachment.match({
			ok: (data) => ({ content: resolveKey(interaction, Root.DiscordEmojiContent, { emoji }), files: [data] }),
			err: () => ({ content: resolveUserKey(interaction, Root.InvalidDiscordEmoji) })
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

	private static CustomEmojiRegExp = /<(?<animated>a)?:(?<name>\w{2,32}):(?<id>\d{17,21})>/g;
}

interface Options {
	emoji: string;
	variant?: EmojiSource;
}
