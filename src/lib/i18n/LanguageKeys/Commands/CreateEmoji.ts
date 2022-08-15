import { FT, T } from '@skyra/http-framework-i18n';
import type { APIUser } from 'discord-api-types/v10';

// Root
export const RootName = T('commands/createEmoji:name');
export const RootDescription = T('commands/createEmoji:description');

export const OptionsEmoji = 'commands/createEmoji:optionsEmoji';
export const OptionsFile = 'commands/createEmoji:optionsFile';

export const Duplicated = T('commands/createEmoji:duplicated');
export const None = T('commands/createEmoji:none');
export const NotAnImage = T('commands/createEmoji:notAnImage');
export const FailedToDownload = T('commands/createEmoji:failedToDownload');
export const Uploaded = FT<{ emoji: string }>('commands/createEmoji:uploaded');
export const UploadedBy = FT<{ user: APIUser }>('commands/createEmoji:uploadedBy');
export const FailedToUpload = T('commands/createEmoji:failedToUpload');
