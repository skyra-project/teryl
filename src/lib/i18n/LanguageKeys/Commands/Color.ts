import type { TheColorApiResult } from '#lib/types/thecolorapi';
import { FT, T, Value } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/color:name');
export const RootDescription = T('commands/color:description');

export const Input = 'commands/color:input';
export const InvalidHex = FT<Value>('commands/color:invalidHex');
export const InvalidHex3 = FT<Value>('commands/color:invalidHex3');
export const InvalidHex6 = FT<Value>('commands/color:invalidHex6');
export const InvalidDecimalInteger = FT<Value>('commands/color:invalidDecimalInteger');
export const InvalidDecimalNegative = FT<Value>('commands/color:invalidDecimalNegative');
export const InvalidDecimalOverflow = FT<Value>('commands/color:invalidDecimalOverflow');
export const InvalidRgb = FT<Value>('commands/color:invalidRGB');
export const InvalidRgbRed = FT<Value>('commands/color:invalidRgbRed');
export const InvalidRgbGreen = FT<Value>('commands/color:invalidRgbGreen');
export const InvalidRgbBlue = FT<Value>('commands/color:invalidRgbBlue');
export const InvalidColor = FT<Value>('commands/color:invalidColor');
export const EmbedDescription = FT<TheColorApiResult>('commands/color:embedDescription');
