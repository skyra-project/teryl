import { Emojis } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { codeBlock, hideLinkEmbed, hyperlink, quote, userMention } from '@discordjs/builders';
import { Command, RegisterMessageCommand, type TransformedArguments } from '@skyra/http-framework';
import { applyNameLocalizedBuilder, getSupportedUserLanguageT, type TFunction } from '@skyra/http-framework-i18n';
import { MessageFlags, type APIEmbed, type APIMessage, type APIMessageInteraction } from 'discord-api-types/v10';

export class UserCommand extends Command {
	@RegisterMessageCommand((builder) => applyNameLocalizedBuilder(builder, LanguageKeys.Commands.Content.RootName))
	public run(interaction: Command.MessageInteraction, options: TransformedArguments.Message) {
		const content = [...this.getFields(interaction, options.message)].join('\n');
		return this.message({ content, flags: MessageFlags.Ephemeral });
	}

	private *getFields(interaction: Command.MessageInteraction, message: APIMessage): Generator<string> {
		const t = getSupportedUserLanguageT(interaction);

		yield this.formatHeader(interaction, message);
		if (message.interaction) yield this.formatInteraction(t, message.interaction);
		if (message.content) yield this.formatContent(t, message.content);
		if (message.embeds.length) yield* this.formatEmbeds(t, message.embeds);
		// message.attachments;
		// message.referenced_message;
		// message.thread;
	}

	private formatHeader(interaction: Command.MessageInteraction, message: APIMessage) {
		const link = hyperlink(message.id, `https://discord.com/channels/${interaction.guild_id ?? '@me'}/${message.channel_id}/${message.id}`);
		const pinned = message.pinned ? ` ${Emojis.MessagePinIcon}` : '';
		return `${Emojis.IdIcon} ${link}${pinned}`;
	}

	private formatInteraction(t: TFunction, interaction: APIMessageInteraction) {
		return t(LanguageKeys.Commands.Content.FieldsInteraction, {
			user: userMention(interaction.user.id),
			command: `</${interaction.name}:${interaction.id}>`
		});
	}

	private formatContent(t: TFunction, content: string) {
		return t(LanguageKeys.Commands.Content.FieldsContent, { content: this.makeBlock(content) });
	}

	private *formatEmbeds(t: TFunction, embeds: APIEmbed[]) {
		for (const embed of embeds) {
			if (embed.title) {
				yield quote(t(LanguageKeys.Commands.Content.FieldsEmbedTitle));
				yield this.makeBlock(embed.title);
			}
			if (embed.url) yield quote(t(LanguageKeys.Commands.Content.FieldsEmbedUrl, { url: hideLinkEmbed(embed.url) }));

			if (embed.author) {
				yield quote(t(LanguageKeys.Commands.Content.FieldsEmbedAuthor));
				yield quote(embed.author.url ? hyperlink(embed.author.name, hideLinkEmbed(embed.author.url)) : embed.author.name);
			}
			if (embed.description) {
				yield quote(t(LanguageKeys.Commands.Content.FieldsEmbedDescription));
				yield this.makeBlock(embed.description);
			}
			if (embed.fields) {
				for (const [index, field] of embed.fields.entries()) {
					yield quote(t(LanguageKeys.Commands.Content.FieldsEmbedField, { index, total: embed.fields.length }));
					yield this.makeBlock(field.name);
					yield this.makeBlock(field.value);
				}
			}
			if (embed.image) yield quote(t(LanguageKeys.Commands.Content.FieldsEmbedImage, { url: hideLinkEmbed(embed.image.url) }));
			if (embed.thumbnail) yield quote(t(LanguageKeys.Commands.Content.FieldsEmbedThumbnail, { url: hideLinkEmbed(embed.thumbnail.url) }));
			if (embed.video?.url) yield quote(t(LanguageKeys.Commands.Content.FieldsEmbedVideo, { url: hideLinkEmbed(embed.video.url) }));
			if (embed.footer) {
				yield quote(t(LanguageKeys.Commands.Content.FieldsEmbedFooter));
				yield this.makeBlock(embed.footer.text);
			}
		}
	}

	// private *getFieldsAttachments(t: TFunction, attachments: APIAttachment[]) {
	// 	yield t(LanguageKeys.Commands.Content.RootName);
	// 	for (const attachment of attachments) {
	// 		// attachment.
	// 	}
	// }

	private makeBlock(content: string, prefix = '> ') {
		return prefix + codeBlock(content.replaceAll('```', '῾῾῾')).replaceAll('\n', `${prefix}\n`);
	}
}
