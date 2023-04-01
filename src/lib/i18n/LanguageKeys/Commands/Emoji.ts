import type { DiscordEmoji } from '#lib/utilities/emoji';
import { FT, T } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/emoji:name');
export const RootDescription = T('commands/emoji:description');

export const OptionsEmoji = 'commands/emoji:optionsEmoji';
export const OptionsVariant = 'commands/emoji:optionsVariant';
export const OptionsVariantApple = T('commands/emoji:optionsVariantApple');
export const OptionsVariantFacebook = T('commands/emoji:optionsVariantFacebook');
export const OptionsVariantGoogle = T('commands/emoji:optionsVariantGoogle');
export const OptionsVariantMicrosoft = T('commands/emoji:optionsVariantMicrosoft');
export const OptionsVariantTwitter = T('commands/emoji:optionsVariantTwitter');
export const OptionsVariantWhatsApp = T('commands/emoji:optionsVariantWhatsApp');
export const EmojiContent = FT<{ id: string; name: string; emoji: string }>('commands/emoji:emojiContent');
export const InvalidEmoji = T('commands/emoji:invalidEmoji');
export const UnsupportedEmoji = T('commands/emoji:unsupportedEmoji');
export const DiscordEmojiContent = FT<{ emoji: DiscordEmoji }>('commands/emoji:discordEmojiContent');
export const InvalidDiscordEmoji = T('commands/emoji:invalidDiscordEmoji');
