import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { err, none, ok, Option, Result, some } from '@sapphire/result';
import type { TypedFT } from '@skyra/http-framework-i18n';

type ColorResult = Result<number, TypedFT<{ value: string }>>;

export function parseColor(value: string): ColorResult {
	return parseHexadecimal(value)
		.orElse(() => parseDecimal(value))
		.orElse(() => parseRGB(value))
		.orElse(() => parseName(value))
		.unwrapOrElse(() => err(LanguageKeys.Commands.Color.InvalidColor));
}

export function getColorHexadecimal(value: number) {
	return value.toString(16).padStart(6, '0');
}

function parseName(value: string): Option<ColorResult> {
	const key = value.replaceAll(' ', '').toLowerCase();
	if (key in names) return some(ok(names[key as keyof typeof names]));
	return none;
}

function parseHexadecimal(value: string): Option<ColorResult> {
	if (!value.startsWith('#')) return none;

	switch (value.length) {
		case 4: // #RGB
		case 5: // #RGBA
			return some(
				hex3.test(value)
					? ok(parseInt(`${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`, 16))
					: err(LanguageKeys.Commands.Color.InvalidHex3)
			);
		case 7: // #RRGGBB
		case 9: // #RRGGBBAA
			return some(hex6.test(value) ? ok(parseInt(value.slice(1), 16)) : err(LanguageKeys.Commands.Color.InvalidHex6));
		default:
			return some(err(LanguageKeys.Commands.Color.InvalidHex));
	}
}

function parseDecimal(value: string): Option<ColorResult> {
	const number = Number(value);
	if (Number.isNaN(number)) return none;
	if (!Number.isSafeInteger(number)) return some(err(LanguageKeys.Commands.Color.InvalidDecimalInteger));
	if (number < 0) return some(err(LanguageKeys.Commands.Color.InvalidDecimalNegative));
	if (number > 0xffffff) return some(err(LanguageKeys.Commands.Color.InvalidDecimalOverflow));
	return some(ok(number));
}

function parseRGB(value: string): Option<ColorResult> {
	if (!value.toLowerCase().startsWith('rgb')) return none;

	const result = rgba.exec(value);
	if (!result) return some(err(LanguageKeys.Commands.Color.InvalidRgb));

	const [, r, g, b] = result;
	const nr = Number(r);
	if (Number.isNaN(nr) || nr < 0 || nr > 255) return some(err(LanguageKeys.Commands.Color.InvalidRgbRed));

	const ng = Number(g);
	if (Number.isNaN(ng) || ng < 0 || ng > 255) return some(err(LanguageKeys.Commands.Color.InvalidRgbGreen));

	const nb = Number(b);
	if (Number.isNaN(nb) || nb < 0 || nb > 255) return some(err(LanguageKeys.Commands.Color.InvalidRgbBlue));

	return some(ok((nr << 16) | (ng << 8) | nb));
}

const hex3 = /^#[0-9a-f]{3,4}$/i;
const hex6 = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i;
const rgba = /^rgba?\( *(\d+) *, *(\d+) *, *(\d+) *(?:, *\d+ *)?\)$/i;
const names = {
	black: 0x000000,
	silver: 0xc0c0c0,
	gray: 0x808080,
	white: 0xffffff,
	maroon: 0x800000,
	red: 0xff0000,
	purple: 0x800080,
	fuchsia: 0xff00ff,
	green: 0x008000,
	lime: 0x00ff00,
	olive: 0x808000,
	yellow: 0xffff00,
	navy: 0x000080,
	blue: 0x0000ff,
	teal: 0x008080,
	aqua: 0x00ffff,
	orange: 0xffa500,
	aliceblue: 0xf0f8ff,
	antiquewhite: 0xfaebd7,
	aquamarine: 0x7fffd4,
	azure: 0xf0ffff,
	beige: 0xf5f5dc,
	bisque: 0xffe4c4,
	blanchedalmond: 0xffebcd,
	blueviolet: 0x8a2be2,
	brown: 0xa52a2a,
	burlywood: 0xdeb887,
	cadetblue: 0x5f9ea0,
	chartreuse: 0x7fff00,
	chocolate: 0xd2691e,
	coral: 0xff7f50,
	cornflowerblue: 0x6495ed,
	cornsilk: 0xfff8dc,
	crimson: 0xdc143c,
	cyan: 0x00ffff,
	darkblue: 0x00008b,
	darkcyan: 0x008b8b,
	darkgoldenrod: 0xb8860b,
	darkgray: 0xa9a9a9,
	darkgreen: 0x006400,
	darkgrey: 0xa9a9a9,
	darkkhaki: 0xbdb76b,
	darkmagenta: 0x8b008b,
	darkolivegreen: 0x556b2f,
	darkorange: 0xff8c00,
	darkorchid: 0x9932cc,
	darkred: 0x8b0000,
	darksalmon: 0xe9967a,
	darkseagreen: 0x8fbc8f,
	darkslateblue: 0x483d8b,
	darkslategray: 0x2f4f4f,
	darkslategrey: 0x2f4f4f,
	darkturquoise: 0x00ced1,
	darkviolet: 0x9400d3,
	deeppink: 0xff1493,
	deepskyblue: 0x00bfff,
	dimgray: 0x696969,
	dimgrey: 0x696969,
	dodgerblue: 0x1e90ff,
	firebrick: 0xb22222,
	floralwhite: 0xfffaf0,
	forestgreen: 0x228b22,
	gainsboro: 0xdcdcdc,
	ghostwhite: 0xf8f8ff,
	gold: 0xffd700,
	goldenrod: 0xdaa520,
	greenyellow: 0xadff2f,
	grey: 0x808080,
	honeydew: 0xf0fff0,
	hotpink: 0xff69b4,
	indianred: 0xcd5c5c,
	indigo: 0x4b0082,
	ivory: 0xfffff0,
	khaki: 0xf0e68c,
	lavender: 0xe6e6fa,
	lavenderblush: 0xfff0f5,
	lawngreen: 0x7cfc00,
	lemonchiffon: 0xfffacd,
	lightblue: 0xadd8e6,
	lightcoral: 0xf08080,
	lightcyan: 0xe0ffff,
	lightgoldenrodyellow: 0xfafad2,
	lightgray: 0xd3d3d3,
	lightgreen: 0x90ee90,
	lightgrey: 0xd3d3d3,
	lightpink: 0xffb6c1,
	lightsalmon: 0xffa07a,
	lightseagreen: 0x20b2aa,
	lightskyblue: 0x87cefa,
	lightslategray: 0x778899,
	lightslategrey: 0x778899,
	lightsteelblue: 0xb0c4de,
	lightyellow: 0xffffe0,
	limegreen: 0x32cd32,
	linen: 0xfaf0e6,
	magenta: 0xff00ff,
	mediumaquamarine: 0x66cdaa,
	mediumblue: 0x0000cd,
	mediumorchid: 0xba55d3,
	mediumpurple: 0x9370db,
	mediumseagreen: 0x3cb371,
	mediumslateblue: 0x7b68ee,
	mediumspringgreen: 0x00fa9a,
	mediumturquoise: 0x48d1cc,
	mediumvioletred: 0xc71585,
	midnightblue: 0x191970,
	mintcream: 0xf5fffa,
	mistyrose: 0xffe4e1,
	moccasin: 0xffe4b5,
	navajowhite: 0xffdead,
	oldlace: 0xfdf5e6,
	olivedrab: 0x6b8e23,
	orangered: 0xff4500,
	orchid: 0xda70d6,
	palegoldenrod: 0xeee8aa,
	palegreen: 0x98fb98,
	paleturquoise: 0xafeeee,
	palevioletred: 0xdb7093,
	papayawhip: 0xffefd5,
	peachpuff: 0xffdab9,
	peru: 0xcd853f,
	pink: 0xffc0cb,
	plum: 0xdda0dd,
	powderblue: 0xb0e0e6,
	rosybrown: 0xbc8f8f,
	royalblue: 0x4169e1,
	saddlebrown: 0x8b4513,
	salmon: 0xfa8072,
	sandybrown: 0xf4a460,
	seagreen: 0x2e8b57,
	seashell: 0xfff5ee,
	sienna: 0xa0522d,
	skyblue: 0x87ceeb,
	slateblue: 0x6a5acd,
	slategray: 0x708090,
	slategrey: 0x708090,
	snow: 0xfffafa,
	springgreen: 0x00ff7f,
	steelblue: 0x4682b4,
	tan: 0xd2b48c,
	thistle: 0xd8bfd8,
	tomato: 0xff6347,
	turquoise: 0x40e0d0,
	violet: 0xee82ee,
	wheat: 0xf5deb3,
	whitesmoke: 0xf5f5f5,
	yellowgreen: 0x9acd32,
	rebeccapurple: 0x663399
};
