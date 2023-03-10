import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import type { TheColorApiResult } from '#lib/types/thecolorapi';
import { getColorHexadecimal, parseColor } from '#lib/utilities/color';
import { EmbedBuilder, inlineCode } from '@discordjs/builders';
import { Time } from '@sapphire/duration';
import { Command, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, resolveUserKey } from '@skyra/http-framework-i18n';
import { Json, safeTimedFetch } from '@skyra/safe-fetch';
import { MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.Color.RootName, LanguageKeys.Commands.Color.RootDescription) //
		.addStringOption((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.Color.Input).setRequired(true).setMaxLength(32))
)
export class UserCommand extends Command {
	public override async chatInputRun(interaction: Command.ChatInputInteraction, options: Options) {
		const result = parseColor(options.input);
		const response = await result.match({
			ok: (color) => this.makeRequest(interaction, color),
			err: (error) => ({ content: resolveUserKey(interaction, error, { value: inlineCode(options.input) }), flags: MessageFlags.Ephemeral })
		});
		return interaction.reply(response);
	}

	private async makeRequest(interaction: Command.ChatInputInteraction, color: number) {
		const hex = getColorHexadecimal(color);
		const url = `https://www.thecolorapi.com/id?hex=${hex}`;
		const result = await Json<TheColorApiResult>(await safeTimedFetch(url, Time.Second * 2));

		const embed = new EmbedBuilder().setColor(color).setThumbnail(`https://www.colorhexa.com/${hex}.png`);
		result.inspect((data) =>
			embed
				.setURL(url)
				.setTitle(data.name.exact_match_name ? data.name.value : `${data.name.value} (${inlineCode(data.name.closest_named_hex)})`)
				.setDescription(resolveUserKey(interaction, LanguageKeys.Commands.Color.EmbedDescription, data))
		);

		return { embeds: [embed.toJSON()] };
	}
}

interface Options {
	input: string;
}
