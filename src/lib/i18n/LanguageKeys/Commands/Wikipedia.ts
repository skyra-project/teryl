import { FT, T } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/wikipedia:name');
export const RootDescription = T('commands/wikipedia:description');

export const OptionsInput = 'commands/wikipedia:optionsInput';
export const NoResults = T('commands/wikipedia:noResults');
export const AbortError = T('commands/wikipedia:abortError');
export const UnknownResponse = T('commands/wikipedia:unknownResponse');
export const UnknownError = T('commands/wikipedia:unknownError');
export const InterWiki = FT<{ link: string }>('commands/wikipedia:interWiki');
