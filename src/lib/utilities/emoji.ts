import { isNullish } from '@sapphire/utilities';
import { container } from '@skyra/http-framework';

export function getTwemojiId(emoji: string): string {
	return [...emoji].map((character) => character.codePointAt(0)!.toString(16)).join('-');
}

export function getTwemojiUrl(emoji: string): string {
	return `https://cdn.jsdelivr.net/gh/twitter/twemoji/assets/72x72/${getTwemojiId(emoji)}.png`;
}

const DiscordEmoji = /^<(?<animated>a?):(?<name>[^:]+):(?<id>\d{17,20})>$/;
export function getDiscordEmojiData(emoji: string): DiscordEmoji | null {
	const data = DiscordEmoji.exec(emoji);
	if (isNullish(data)) return null;

	return {
		id: data.groups!.id,
		name: data.groups!.name,
		animated: Boolean(data.groups!.animated)
	};
}

export function getDiscordEmojiUrl(emoji: DiscordEmoji): string {
	return container.rest.cdn.emoji(emoji.id, emoji.animated ? 'gif' : 'png');
}

export interface DiscordEmoji {
	id: string;
	name: string;
	animated: boolean;
}
