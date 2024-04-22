import { FT, T, type Value } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/color:name');
export const RootDescription = T('commands/color:description');

export const Input = 'commands/color:input';
export const InvalidColor = FT<Value>('commands/color:invalidColor');
export const EmbedDescription = FT<{
	hex: string;
	rgb: string;
	hsl: string;
	oklch: string;
	p3: string;
}>('commands/color:embedDescription');
