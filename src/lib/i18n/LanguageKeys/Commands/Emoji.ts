import type { DiscordEmoji } from '#lib/utilities/emoji';
import { FT, T } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/emoji:name');
export const RootDescription = T('commands/emoji:description');

export const OptionsEmoji = 'commands/emoji:optionsEmoji';
export const TwemojiContent = FT<{ emoji: string; id: string }>('commands/emoji:twemojiContent');
export const InvalidTwemoji = T('commands/emoji:invalidTwemoji');
export const DiscordEmojiContent = FT<{ emoji: DiscordEmoji }>('commands/emoji:discordEmojiContent');
export const InvalidDiscordEmoji = T('commands/emoji:invalidDiscordEmoji');
