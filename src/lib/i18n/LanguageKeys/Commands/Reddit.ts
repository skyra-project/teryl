import { FT, T } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/reddit:name');
export const RootDescription = T('commands/reddit:description');

export const OptionsReddit = 'commands/reddit:optionsReddit';
export const OptionsPost = 'commands/reddit:optionsPost';

export const Subreddit = 'commands/reddit:subreddit';
export const Post = 'commands/reddit:post';

export const InvalidName = T('commands/reddit:invalidName');
export const InvalidPostLink = FT<{ formats: string }>('commands/reddit:invalidPostLink');
export const Banned = T('commands/reddit:banned');
export const PostResult = FT<{ title: string; author: string; url: string }>('commands/reddit:post');
export const NoPosts = T('commands/reddit:noPosts');
export const AllNsfw = T('commands/reddit:allNsfw');
export const AllNsfl = T('commands/reddit:allNsfl');
export const AbortError = T('commands/reddit:abortError');
export const ParsePostException = T('commands/reddit:parsePostException');
export const UnavailableErrorPrivate = T('commands/reddit:unavailableErrorPrivate');
export const UnavailableErrorGoldOnly = T('commands/reddit:unavailableErrorGoldOnly');
export const UnavailableErrorQuarantined = FT<{ reason: string }>('commands/reddit:unavailableErrorQuarantined');
export const UnavailableErrorGated = FT<{ reason: string }>('commands/reddit:unavailableErrorGated');
export const UnavailableErrorNotFound = T('commands/reddit:unavailableErrorNotFound');
export const UnavailableErrorBanned = T('commands/reddit:unavailableErrorBanned');
export const UnavailableForLegalReasons = T('commands/reddit:unavailableForLegalReasons');
export const Unavailable = T('commands/reddit:unavailable');
export const UnknownError = T('commands/reddit:unknownError');
