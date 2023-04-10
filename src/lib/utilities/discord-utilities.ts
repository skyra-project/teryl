import type { APIChannel } from 'discord-api-types/v10';

export function isNsfwChannel(channel: Partial<APIChannel>): boolean {
	return 'nsfw' in channel ? channel.nsfw ?? false : false;
}
