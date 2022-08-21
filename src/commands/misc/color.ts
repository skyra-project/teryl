import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import type { TheColorApiResult } from '#lib/types/thecolorapi';
import { json, safeTimedFetch } from '#lib/utilities/fetch';
import { EmbedBuilder, inlineCode } from '@discordjs/builders';
import { err, none, ok, Result, some, type Option } from '@sapphire/result';
import { Time } from '@sapphire/time-utilities';
import { Command, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, resolveUserKey, type TypedFT } from '@skyra/http-framework-i18n';
import { MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.Color.RootName, LanguageKeys.Commands.Color.RootDescription) //
		.addStringOption((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.Color.Input).setRequired(true).setMaxLength(32))
)
export class UserCommand extends Command {
	public override async chatInputRun(interaction: Command.ChatInputInteraction, options: Options) {
		const result = this.parse(options.input);
		const response = await result.match({
			ok: (color) => this.makeRequest(interaction, color),
			err: (error) => ({ content: resolveUserKey(interaction, error, { input: inlineCode(options.input) }), flags: MessageFlags.Ephemeral })
		});
		return interaction.sendMessage(response);
	}

	private async makeRequest(interaction: Command.ChatInputInteraction, color: string) {
		const url = `https://www.thecolorapi.com/id?hex=${color}`;
		const result = await json<TheColorApiResult>(await safeTimedFetch(url, Time.Second * 2));

		const embed = new EmbedBuilder().setColor(parseInt(color, 16)).setThumbnail(`https://www.colorhexa.com/${color}.png`);
		result.inspect((data) =>
			embed
				.setURL(url)
				.setTitle(data.name.exact_match_name ? data.name.value : `${data.name.value} (${inlineCode(data.name.closest_named_hex)})`)
				.setDescription(resolveUserKey(interaction, LanguageKeys.Commands.Color.EmbedDescription, data))
		);

		return { embeds: [embed.toJSON()] };
	}

	private parse(value: string): Result<string, TypedFT<{ input: string }>> {
		return this.parseHexadecimal(value)
			.orElse(() => this.parseDecimal(value))
			.orElse(() => this.parseRGB(value))
			.orElse(() => this.parseName(value))
			.unwrapOrElse(() => err(LanguageKeys.Commands.Color.InvalidColor));
	}

	private parseName(value: string): Option<Result<string, TypedFT<{ input: string }>>> {
		const key = value.replaceAll(' ', '').toLowerCase();
		if (key in UserCommand.names) return some(ok(UserCommand.names[key as keyof typeof UserCommand.names]));
		return none;
	}

	private parseHexadecimal(value: string): Option<Result<string, TypedFT<{ input: string }>>> {
		if (!value.startsWith('#')) return none;

		switch (value.length) {
			case 4: // #RGB
			case 5: // #RGBA
				return some(
					UserCommand.hex3.test(value)
						? ok(`${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`)
						: err(LanguageKeys.Commands.Color.InvalidHex3)
				);
			case 7: // #RRGGBB
			case 9: // #RRGGBBAA
				return some(UserCommand.hex6.test(value) ? ok(value.slice(1)) : err(LanguageKeys.Commands.Color.InvalidHex6));
			default:
				return some(err(LanguageKeys.Commands.Color.InvalidHex));
		}
	}

	private parseDecimal(value: string): Option<Result<string, TypedFT<{ input: string }>>> {
		const number = Number(value);
		if (Number.isNaN(number)) return none;
		if (Number.isSafeInteger(number)) return some(err(LanguageKeys.Commands.Color.InvalidDecimalInteger));
		if (number < 0) return some(err(LanguageKeys.Commands.Color.InvalidDecimalNegative));
		if (number > 0xffffff) return some(err(LanguageKeys.Commands.Color.InvalidDecimalOverflow));
		return some(ok(number.toString(16).padStart(6, '0')));
	}

	private parseRGB(value: string): Option<Result<string, TypedFT<{ input: string }>>> {
		if (!value.startsWith('rgb')) return none;

		const result = UserCommand.rgba.exec(value);
		if (!result) return some(err(LanguageKeys.Commands.Color.InvalidRgb));

		const [, r, g, b] = result;
		const nr = Number(r);
		if (Number.isNaN(nr) || nr < 0 || nr > 255) return some(err(LanguageKeys.Commands.Color.InvalidRgbRed));

		const ng = Number(g);
		if (Number.isNaN(ng) || ng < 0 || ng > 255) return some(err(LanguageKeys.Commands.Color.InvalidRgbGreen));

		const nb = Number(b);
		if (Number.isNaN(nb) || nb < 0 || nb > 255) return some(err(LanguageKeys.Commands.Color.InvalidRgbBlue));

		return some(ok(((nr << 16) | (ng << 8) | nb).toString(16).padStart(6, '0')));
	}

	private static readonly hex3 = /^#[0-9a-f]{3,4}$/;
	private static readonly hex6 = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/;
	private static readonly rgba = /^rgba?\( *(\d+) *, *(\d+) *, *(\d+) *(?:, *\d+ *)?\)$/;
	private static readonly names = {
		black: '000000',
		silver: 'c0c0c0',
		gray: '808080',
		white: 'ffffff',
		maroon: '800000',
		red: 'ff0000',
		purple: '800080',
		fuchsia: 'ff00ff',
		green: '008000',
		lime: '00ff00',
		olive: '808000',
		yellow: 'ffff00',
		navy: '000080',
		blue: '0000ff',
		teal: '008080',
		aqua: '00ffff',
		orange: 'ffa500',
		aliceblue: 'f0f8ff',
		antiquewhite: 'faebd7',
		aquamarine: '7fffd4',
		azure: 'f0ffff',
		beige: 'f5f5dc',
		bisque: 'ffe4c4',
		blanchedalmond: 'ffebcd',
		blueviolet: '8a2be2',
		brown: 'a52a2a',
		burlywood: 'deb887',
		cadetblue: '5f9ea0',
		chartreuse: '7fff00',
		chocolate: 'd2691e',
		coral: 'ff7f50',
		cornflowerblue: '6495ed',
		cornsilk: 'fff8dc',
		crimson: 'dc143c',
		cyan: '00ffff',
		darkblue: '00008b',
		darkcyan: '008b8b',
		darkgoldenrod: 'b8860b',
		darkgray: 'a9a9a9',
		darkgreen: '006400',
		darkgrey: 'a9a9a9',
		darkkhaki: 'bdb76b',
		darkmagenta: '8b008b',
		darkolivegreen: '556b2f',
		darkorange: 'ff8c00',
		darkorchid: '9932cc',
		darkred: '8b0000',
		darksalmon: 'e9967a',
		darkseagreen: '8fbc8f',
		darkslateblue: '483d8b',
		darkslategray: '2f4f4f',
		darkslategrey: '2f4f4f',
		darkturquoise: '00ced1',
		darkviolet: '9400d3',
		deeppink: 'ff1493',
		deepskyblue: '00bfff',
		dimgray: '696969',
		dimgrey: '696969',
		dodgerblue: '1e90ff',
		firebrick: 'b22222',
		floralwhite: 'fffaf0',
		forestgreen: '228b22',
		gainsboro: 'dcdcdc',
		ghostwhite: 'f8f8ff',
		gold: 'ffd700',
		goldenrod: 'daa520',
		greenyellow: 'adff2f',
		grey: '808080',
		honeydew: 'f0fff0',
		hotpink: 'ff69b4',
		indianred: 'cd5c5c',
		indigo: '4b0082',
		ivory: 'fffff0',
		khaki: 'f0e68c',
		lavender: 'e6e6fa',
		lavenderblush: 'fff0f5',
		lawngreen: '7cfc00',
		lemonchiffon: 'fffacd',
		lightblue: 'add8e6',
		lightcoral: 'f08080',
		lightcyan: 'e0ffff',
		lightgoldenrodyellow: 'fafad2',
		lightgray: 'd3d3d3',
		lightgreen: '90ee90',
		lightgrey: 'd3d3d3',
		lightpink: 'ffb6c1',
		lightsalmon: 'ffa07a',
		lightseagreen: '20b2aa',
		lightskyblue: '87cefa',
		lightslategray: '778899',
		lightslategrey: '778899',
		lightsteelblue: 'b0c4de',
		lightyellow: 'ffffe0',
		limegreen: '32cd32',
		linen: 'faf0e6',
		magenta: 'ff00ff',
		mediumaquamarine: '66cdaa',
		mediumblue: '0000cd',
		mediumorchid: 'ba55d3',
		mediumpurple: '9370db',
		mediumseagreen: '3cb371',
		mediumslateblue: '7b68ee',
		mediumspringgreen: '00fa9a',
		mediumturquoise: '48d1cc',
		mediumvioletred: 'c71585',
		midnightblue: '191970',
		mintcream: 'f5fffa',
		mistyrose: 'ffe4e1',
		moccasin: 'ffe4b5',
		navajowhite: 'ffdead',
		oldlace: 'fdf5e6',
		olivedrab: '6b8e23',
		orangered: 'ff4500',
		orchid: 'da70d6',
		palegoldenrod: 'eee8aa',
		palegreen: '98fb98',
		paleturquoise: 'afeeee',
		palevioletred: 'db7093',
		papayawhip: 'ffefd5',
		peachpuff: 'ffdab9',
		peru: 'cd853f',
		pink: 'ffc0cb',
		plum: 'dda0dd',
		powderblue: 'b0e0e6',
		rosybrown: 'bc8f8f',
		royalblue: '4169e1',
		saddlebrown: '8b4513',
		salmon: 'fa8072',
		sandybrown: 'f4a460',
		seagreen: '2e8b57',
		seashell: 'fff5ee',
		sienna: 'a0522d',
		skyblue: '87ceeb',
		slateblue: '6a5acd',
		slategray: '708090',
		slategrey: '708090',
		snow: 'fffafa',
		springgreen: '00ff7f',
		steelblue: '4682b4',
		tan: 'd2b48c',
		thistle: 'd8bfd8',
		tomato: 'ff6347',
		turquoise: '40e0d0',
		violet: 'ee82ee',
		wheat: 'f5deb3',
		whitesmoke: 'f5f5f5',
		yellowgreen: '9acd32',
		rebeccapurple: '663399'
	};
}

interface Options {
	input: string;
}
