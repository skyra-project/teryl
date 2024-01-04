import { FT, T, type Value } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/dictionary:name');
export const RootDescription = T('commands/dictionary:description');

export const OptionsInput = 'commands/dictionary:optionsInput';
export const ContentTitle = FT<Value>('commands/dictionary:contentTitle');
export const ContentPhonetic = FT<Value>('commands/dictionary:contentPhonetic');
export const ContentPartOfSpeech = FT<Value>('commands/dictionary:contentPartOfSpeech');
export const ContentExample = FT<Value>('commands/dictionary:contentExample');
export const FetchAbort = FT<Value>('commands/dictionary:fetchAbort');
export const FetchNoResults = FT<Value>('commands/dictionary:fetchNoResults');
export const FetchRateLimited = FT<Value>('commands/dictionary:fetchRateLimited');
export const FetchServerError = FT<Value>('commands/dictionary:fetchServerError');
export const FetchUnknownError = FT<Value>('commands/dictionary:fetchUnknownError');
