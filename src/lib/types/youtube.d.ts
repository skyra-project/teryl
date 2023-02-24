export interface YouTubeResult {
	kind: string;
	etag: string;
	nextPageToken: string;
	regionCode: string;
	pageInfo: YouTubeResultPageInfo;
	items: YouTubeResultItem[];
}

export interface YouTubeResultItem {
	kind: string;
	etag: string;
	id: YouTubeResultId;
	snippet: YouTubeResultSnippet;
}

export interface YouTubeResultId {
	kind: string;
	playlistId?: string;
	channelId?: string;
	videoId?: string;
}

export interface YouTubeResultSnippet {
	publishedAt: Date;
	channelId: string;
	title: string;
	description: string;
	thumbnails: YouTubeResultThumbnails;
	channelTitle: string;
	liveBroadcastContent: string;
}

export interface YouTubeResultThumbnails {
	default: YouTubeResultThumbnail;
	medium: YouTubeResultThumbnail;
	high: YouTubeResultThumbnail;
}

export interface YouTubeResultThumbnail {
	url: string;
	width: number;
	height: number;
}

export interface YouTubeResultPageInfo {
	totalResults: number;
	resultsPerPage: number;
}
