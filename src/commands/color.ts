import { clamp256, round2, round6 } from '#lib/common/numbers';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import type { TheColorApiResult } from '#lib/types/thecolorapi';
import { EmbedBuilder, inlineCode } from '@discordjs/builders';
import { Time } from '@sapphire/duration';
import { isNullish } from '@sapphire/utilities';
import { Command, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, resolveUserKey } from '@skyra/http-framework-i18n';
import { Json, safeTimedFetch } from '@skyra/safe-fetch';
import { formatHex, formatHex8, hsl, oklch, p3, parse, rgb, type Color } from 'culori';
import { MessageFlags } from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.Color;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription) //
		.addStringOption((builder) => applyLocalizedBuilder(builder, Root.Input).setRequired(true))
)
export class UserCommand extends Command {
	public override async chatInputRun(interaction: Command.ChatInputInteraction, options: Options) {
		const color = parse(options.input);
		if (isNullish(color)) {
			const content = resolveUserKey(interaction, Root.InvalidColor, { value: inlineCode(options.input) });
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const response = await this.makeRequest(interaction, color);
		return interaction.reply(response);
	}

	private async makeRequest(interaction: Command.ChatInputInteraction, color: Color) {
		const { int, text } = this.getHexadecimal(color);
		const url = `https://www.thecolorapi.com/id?hex=${text}`;
		const result = await Json<TheColorApiResult>(await safeTimedFetch(url, Time.Second * 2));

		const embed = new EmbedBuilder() //
			.setColor(int)
			.setThumbnail(`https://www.colorhexa.com/${text}.png`)
			.setDescription(resolveUserKey(interaction, Root.EmbedDescription, this.formatColor(color)));
		result.inspect((data) =>
			embed
				.setURL(url)
				.setTitle(data.name.exact_match_name ? data.name.value : `${data.name.value} (${inlineCode(data.name.closest_named_hex)})`)
		);

		return { embeds: [embed.toJSON()], flags: MessageFlags.Ephemeral };
	}

	private getHexadecimal(color: Color) {
		const parsed = rgb(color);
		const r = clamp256(parsed.r);
		const g = clamp256(parsed.g);
		const b = clamp256(parsed.b);

		const int = (r << 16) | (g << 8) | b;
		return { int, text: int.toString(16).padStart(6, '0') };
	}

	private formatColor(color: Color) {
		return {
			hex: inlineCode(isNullish(color.alpha) ? formatHex(color) : formatHex8(color)),
			rgb: inlineCode(this.formatRgb(color)),
			hsl: inlineCode(this.formatHsl(color)),
			oklch: inlineCode(this.formatOklch(color)),
			p3: inlineCode(this.formatP3(color))
		};
	}

	private formatRgb(color: Color) {
		const parsed = rgb(color);
		const r = clamp256(parsed.r);
		const g = clamp256(parsed.g);
		const b = clamp256(parsed.b);
		return isNullish(parsed.alpha) //
			? `rgb(${r} ${g} ${b})`
			: `rgb(${r} ${g} ${b} / ${round2(parsed.alpha)})`;
	}

	private formatHsl(color: Color) {
		const parsed = hsl(color);
		const h = round2(parsed.h ?? 0);
		const s = round2(parsed.s * 100);
		const l = round2(parsed.l * 100);
		return isNullish(parsed.alpha) //
			? `hsl(${h} ${s}% ${l}%)`
			: `hsl(${h} ${s}% ${l}% / ${round2(parsed.alpha)})`;
	}

	private formatOklch(color: Color) {
		const parsed = oklch(color)!;
		const l = round6(parsed.l * 100);
		const c = round6(parsed.c);
		const h = round6(parsed.h ?? 0);
		return isNullish(parsed.alpha) //
			? `oklch(${l}% ${c} ${h})`
			: `oklch(${l}% ${c} ${h} / ${round2(parsed.alpha)})`;
	}

	private formatP3(color: Color) {
		const parsed = p3(color);
		const r = round6(parsed.r);
		const g = round6(parsed.g);
		const b = round6(parsed.b);
		return isNullish(parsed.alpha) //
			? `color(display-p3 ${r} ${g} ${b})`
			: `color(display-p3 ${r} ${g} ${b} / ${round2(parsed.alpha)})`;
	}
}

interface Options {
	input: string;
}
