import { FT, T } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/content:name');
export const FieldsInteraction = FT<{ user: string; command: string }>('commands/content:fieldsInteraction');
export const FieldsContent = FT<{ content: string }>('commands/content:fieldsContent');
export const FieldsEmbed = FT<{ index: number; total: number }>('commands/content:fieldsEmbed');
export const FieldsEmbedTitle = T('commands/content:fieldsEmbedTitle');
export const FieldsEmbedUrl = FT<{ url: string }>('commands/content:fieldsEmbedUrl');
export const FieldsEmbedAuthor = T('commands/content:fieldsEmbedAuthor');
export const FieldsEmbedDescription = T('commands/content:fieldsEmbedDescription');
export const FieldsEmbedField = FT<{ index: number; total: number }>('commands/content:fieldsEmbedField');
export const FieldsEmbedImage = FT<{ url: string }>('commands/content:fieldsEmbedImage');
export const FieldsEmbedThumbnail = FT<{ url: string }>('commands/content:fieldsEmbedThumbnail');
export const FieldsEmbedVideo = FT<{ url: string }>('commands/content:fieldsEmbedVideo');
export const FieldsEmbedFooter = T('commands/content:fieldsEmbedFooter');
