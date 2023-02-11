import type { YouTubeResultId } from '#lib/types/youtube';
import { none, some, type Option } from '@sapphire/result';
import { container } from '@skyra/http-framework';

export function getLinkFromResultId(result: YouTubeResultId): Option<string> {
	switch (result.kind) {
		case 'youtube#channel':
			return some(getChannelId(result.channelId!));
		case 'youtube#playlist':
			return some(getPlaylistId(result.playlistId!));
		case 'youtube#video':
			return some(getVideoId(result.videoId!));
		default: {
			container.logger.error('[YouTube] Unknown Item Kind', result);
			return none;
		}
	}
}

export function getLinkFromSelectMenu(value: string): string {
	switch (value[0] as 'c' | 'p' | 'v') {
		case 'c':
			return getChannelId(value.slice(2));
		case 'p':
			return getPlaylistId(value.slice(2));
		case 'v':
			return getVideoId(value.slice(2));
	}
}

export function getSelectMenuValue(result: YouTubeResultId) {
	switch (result.kind) {
		case 'youtube#channel':
			return some(`c:${result.channelId}`);
		case 'youtube#playlist':
			return some(`p:${result.playlistId}`);
		case 'youtube#video':
			return some(`v:${result.videoId}`);
		default: {
			container.logger.error('[YouTube] Unknown Item Kind', result);
			return none;
		}
	}
}

function getChannelId(id: string) {
	return `https://youtube.com/channel/${id}` as const;
}

function getPlaylistId(id: string) {
	return `https://www.youtube.com/playlist?list=${id}` as const;
}

function getVideoId(id: string) {
	return `https://youtu.be/${id}` as const;
}
