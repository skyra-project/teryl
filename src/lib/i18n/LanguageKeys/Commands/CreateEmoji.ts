import { FT, T } from '@skyra/http-framework-i18n';
import type { APIUser } from 'discord-api-types/v10';

// Root
export const RootName = T('commands/createEmoji:name');
export const RootDescription = T('commands/createEmoji:description');

export const OptionsEmoji = 'commands/createEmoji:optionsEmoji';
export const OptionsFile = 'commands/createEmoji:optionsFile';
export const OptionsName = 'commands/createEmoji:optionsName';

export const MissingPermissions = T('commands/createEmoji:missingPermissions');
export const Duplicated = T('commands/createEmoji:duplicated');
export const None = T('commands/createEmoji:none');
export const InvalidName = T('commands/createEmoji:invalidName');
export const NotAnImage = T('commands/createEmoji:notAnImage');
export const FailedToDownload = T('commands/createEmoji:failedToDownload');
export const Uploaded = FT<{ emoji: string }>('commands/createEmoji:uploaded');
export const UploadedBy = FT<{ user: APIUser }>('commands/createEmoji:uploadedBy');
export const FailedToUpload = T('commands/createEmoji:failedToUpload');
export const FailedToUploadDiscordDown = T('commands/createEmoji:failedToUploadDiscordDown');
export const FailedToUploadMissingPermissions = T('commands/createEmoji:failedToUploadMissingPermissions');
export const FailedToUploadInvalidBody = T('commands/createEmoji:failedToUploadInvalidBody');
export const FailedToUploadMaximumEmojis = T('commands/createEmoji:failedToUploadMaximumEmojis');
export const FailedToUploadMaximumAnimatedEmojis = T('commands/createEmoji:failedToUploadMaximumAnimatedEmojis');
export const ContentLengthMissing = T('commands/createEmoji:contentLengthMissing');
export const ContentLengthInvalid = T('commands/createEmoji:contentLengthInvalid');
export const ContentLengthTooBig = T('commands/createEmoji:contentLengthTooBig');
export const ContentTypeMissing = T('commands/createEmoji:contentTypeMissing');
export const ContentTypeUnsupported = T('commands/createEmoji:contentTypeUnsupported');
