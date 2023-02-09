import { FT, T } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/reddit:name');
export const RootDescription = T('commands/reddit:description');

export const OptionsReddit = 'commands/reddit:optionsReddit';

export const InvalidName = T('commands/reddit:invalidName');
export const Banned = T('commands/reddit:banned');
export const Post = FT<{ title: string; author: string; url: string }>('commands/reddit:post');
export const NoPosts = T('commands/reddit:noPosts');
export const NsfwFailedToFetchChannel = T('commands/reddit:nsfwFailedToFetchChannel');
export const AllNsfw = T('commands/reddit:allNsfw');
export const AllNsfl = T('commands/reddit:allNsfl');
export const AbortError = T('commands/reddit:abortError');
export const UnavailableErrorPrivate = T('commands/reddit:unavailableErrorPrivate');
export const UnavailableErrorQuarantined = FT<{ reason: string }>('commands/reddit:unavailableErrorQuarantined');
export const UnavailableErrorGated = FT<{ reason: string }>('commands/reddit:unavailableErrorGated');
export const UnavailableErrorNotFound = T('commands/reddit:unavailableErrorNotFound');
export const UnavailableErrorBanned = T('commands/reddit:unavailableErrorBanned');
export const UnavailableForLegalReasons = T('commands/reddit:unavailableForLegalReasons');
export const Unavailable = T('commands/reddit:unavailable');
export const UnknownError = T('commands/reddit:unknownError');
