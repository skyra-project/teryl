import { FT, T } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/twitch:name');
export const RootDescription = T('commands/twitch:description');

export const User = 'commands/twitch:user';
export const UserOptionsName = 'commands/twitch:userOptionsName';
export const UserDoesNotExist = T('commands/twitch:userDoesNotExist');
export const UserEmbedTitles = T<{ followers: string; views: string; partner: string }>('commands/twitch:userEmbedTitles');
export const UserEmbedFieldFollowers = FT<{ value: number }>('commands/twitch:userEmbedFieldFollowers');
export const UserEmbedFieldViews = FT<{ value: number }>('commands/twitch:userEmbedFieldViews');
export const UserAffiliate = T('commands/twitch:userAffiliate');
export const UserPartner = T('commands/twitch:userPartner');
export const UserNotAffiliated = T('commands/twitch:userNotAffiliated');

export const Followage = 'commands/twitch:followage';
export const FollowageOptionsUser = 'commands/twitch:followageOptionsUser';
export const FollowageOptionsChannel = 'commands/twitch:followageOptionsChannel';
export const FollowageDoesNotExist = T('commands/twitch:followageDoesNotExist');
export const FollowageDoesNotFollow = FT<{ user: string; channel: string }>('commands/twitch:followageDoesNotFollow');
export const FollowageEmbedDescription = FT<{ user: string; time: string }>('commands/twitch:followageEmbedDescription');
