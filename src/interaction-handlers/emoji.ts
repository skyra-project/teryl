import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { getDiscordEmojiUrl, type DiscordEmoji } from '#lib/utilities/emoji';
import { EmbedBuilder } from '@discordjs/builders';
import { InteractionHandler, type Interactions } from '@skyra/http-framework';
import { resolveUserKey } from '@skyra/http-framework-i18n';
import type { APIActionRowComponent, APIStringSelectComponent } from 'discord-api-types/v10';

export class UserHandler extends InteractionHandler {
	public async run(interaction: Interactions.MessageComponentStringSelect) {
		const [value] = interaction.values;
		const [id, name, animated] = value.split('.') as [string, string, '0' | '1'];
		const emoji = { id, name, animated: animated === '1' } satisfies DiscordEmoji;
		const embed = new EmbedBuilder()
			.setDescription(resolveUserKey(interaction, LanguageKeys.Commands.Emoji.DiscordEmojiContent, { emoji }))
			.setThumbnail(getDiscordEmojiUrl(emoji))
			.setTimestamp();

		const row = interaction.message.components![0] as APIActionRowComponent<APIStringSelectComponent>;
		const component = row.components[0];
		const options = component.options.map((option) => ({ ...option, default: option.value === value }));
		return interaction.update({ embeds: [embed.toJSON()], components: [{ ...row, components: [{ ...component, options }] }] });
	}
}
