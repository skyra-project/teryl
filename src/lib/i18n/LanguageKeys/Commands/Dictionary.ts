import { FT, T, type Value } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/dictionary:name');
export const RootDescription = T('commands/dictionary:description');

export const OptionsInput = 'commands/dictionary:optionsInput';
export const ContentTitle = FT<Value>('commands/dictionary:contentTitle');
export const ContentPronunciation = FT<Value>('commands/dictionary:contentPronunciation');
export const ContentType = FT<Value>('commands/dictionary:contentType');
export const ContentEmoji = FT<Value>('commands/dictionary:contentEmoji');
export const FetchAbort = FT<Value>('commands/dictionary:fetchAbort');
export const FetchAuthorizationFailed = FT<Value>('commands/dictionary:fetchAuthorizationFailed');
export const FetchNoResults = FT<Value>('commands/dictionary:fetchNoResults');
export const FetchRateLimited = FT<Value>('commands/dictionary:fetchRateLimited');
export const FetchServerError = FT<Value>('commands/dictionary:fetchServerError');
export const FetchUnknownError = FT<Value>('commands/dictionary:fetchUnknownError');
