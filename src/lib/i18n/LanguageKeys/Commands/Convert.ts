import { FT, T } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/convert:name');
export const RootDescription = T('commands/convert:description');

export const Amount = 'commands/convert:amount';
export const From = 'commands/convert:from';
export const To = 'commands/convert:to';

export const UnitNotSupported = FT<{ unit: string }>('commands/convert:unitNotSupported');
export const MismatchingTypes = FT<{ fromUnit: string; toUnit: string }>('commands/convert:mismatchingTypes');
export const Result = FT<{
	fromValue: number;
	fromUnitSymbol: string;
	fromUnitName: string;
	toValue: number;
	toUnitSymbol: string;
	toUnitName: string;
}>('commands/convert:result');
