import type { TheColorApiResult } from '#lib/types/thecolorapi';
import { FT, T } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/color:name');
export const RootDescription = T('commands/color:description');

export const Input = 'commands/color:input';
export const InvalidHex = FT<{ input: string }>('commands/color:invalidHex');
export const InvalidHex3 = FT<{ input: string }>('commands/color:invalidHex3');
export const InvalidHex6 = FT<{ input: string }>('commands/color:invalidHex6');
export const InvalidDecimalInteger = FT<{ input: string }>('commands/color:invalidDecimalInteger');
export const InvalidDecimalNegative = FT<{ input: string }>('commands/color:invalidDecimalNegative');
export const InvalidDecimalOverflow = FT<{ input: string }>('commands/color:invalidDecimalOverflow');
export const InvalidRgb = FT<{ input: string }>('commands/color:invalidRGB');
export const InvalidRgbRed = FT<{ input: string }>('commands/color:invalidRgbRed');
export const InvalidRgbGreen = FT<{ input: string }>('commands/color:invalidRgbGreen');
export const InvalidRgbBlue = FT<{ input: string }>('commands/color:invalidRgbBlue');
export const InvalidColor = FT<{ input: string }>('commands/color:invalidColor');
export const EmbedDescription = FT<TheColorApiResult>('commands/color:embedDescription');
