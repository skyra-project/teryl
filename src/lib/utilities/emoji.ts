import { PathSrc } from '#lib/common/constants';
import { isNullish } from '@sapphire/utilities';
import { container } from '@skyra/http-framework';
import { readFile } from 'node:fs/promises';

const PathEmoji = new URL('./generated/data/emoji.json', PathSrc);
const emojis = new Map((JSON.parse(await readFile(PathEmoji, 'utf8')) as Emoji[]).map((data) => [data.id, data.name] as const));

export function getEmojiId(emoji: string): EmojiId {
	return [...emoji].map((character) => character.codePointAt(0)!.toString(16)).join('-') as EmojiId;
}

export function getEmojiName(emoji: EmojiId) {
	return emojis.get(emoji) ?? null;
}

export function getSanitizedEmojiName(emoji: EmojiId) {
	const name = emojis.get(emoji);
	if (isNullish(name)) return null;

	return name.replaceAll(' ', '_').replaceAll(/[^\w]+/g, '');
}

export function getEmojiUrl(id: EmojiId, source: EmojiSource): string | null {
	const name = emojis.get(id);
	if (isNullish(name)) return null;

	// https://em-content.zobj.net/thumbs/120/apple/354/red-heart_2764-fe0f.png
	const code = EmojipediaCodes[source];
	const sanitized = name.replaceAll(' ', '-').replaceAll(':', '').toLowerCase();
	return `https://em-content.zobj.net/thumbs/120/${source}/${code}/${sanitized}_${id}.png`;
}

export function getTwemojiUrl(emoji: string): string {
	return `https://cdn.jsdelivr.net/gh/twitter/twemoji/assets/72x72/${getEmojiId(emoji)}.png`;
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

export enum EmojiSource {
	Apple = 'apple',
	Facebook = 'facebook',
	Google = 'google',
	Microsoft = 'microsoft',
	MicrosoftFluent = 'microsoft-3D-fluent',
	Samsung = 'samsung',
	Twitter = 'twitter',
	WhatsApp = 'whatsapp'
}

const EmojipediaCodes = {
	[EmojiSource.Apple]: '391',
	[EmojiSource.Facebook]: '355',
	[EmojiSource.Google]: '412',
	[EmojiSource.Microsoft]: '407',
	[EmojiSource.MicrosoftFluent]: '406',
	[EmojiSource.Samsung]: '405',
	[EmojiSource.Twitter]: '408',
	[EmojiSource.WhatsApp]: '401'
} as const satisfies Record<EmojiSource, string>;

export interface DiscordEmoji {
	id: string;
	name: string;
	animated: boolean;
}

interface Emoji {
	id: string;
	name: string;
}

type EmojiId = string & { __TYPE__: 'EmojiId' };
