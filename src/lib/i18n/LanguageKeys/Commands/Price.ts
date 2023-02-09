import { FT, T } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/price:name');
export const RootDescription = T('commands/price:description');

export const OptionsAmount = 'commands/price:optionsAmount';
export const OptionsFrom = 'commands/price:optionsFrom';
export const OptionsTo = 'commands/price:optionsTo';

export const AbortError = T('commands/price:abortError');
export const UnknownServerError = T('commands/price:unknownServerError');
export const Error = T('commands/price:error');
export const Result = FT<{ from: string; amounts: readonly string[] }>('commands/price:result');
