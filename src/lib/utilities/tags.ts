import { cut } from '#lib/common/strings';
import type { Tag, TagAlias } from '@prisma/client';
import { isNullishOrEmpty } from '@sapphire/utilities';
import { container } from '@skyra/http-framework';
import type { APIApplicationCommandOptionChoice } from 'discord-api-types/v10';

const tagNameRegExp = /^[a-z0-9_\-]+$/;
export function sanitizeTagName(name: string) {
	name = name.toLowerCase();
	return tagNameRegExp.test(name) ? name : null;
}

export function searchTag(guildId: bigint, query?: string | null) {
	return isNullishOrEmpty(query) ? searchAllTags(guildId) : searchLimitedTags(guildId, query);
}

async function searchAllTags(guildId: bigint): Promise<readonly TagSearchResult[]> {
	const tags = await container.prisma.tag.findMany({
		where: { guildId },
		select: { id: true, name: true, content: true, uses: true },
		orderBy: { uses: 'desc' },
		take: 25
	});

	return tags.map((value) => ({ score: 1, value }));
}

async function searchLimitedTags(guildId: bigint, query: string): Promise<readonly TagSearchResult[]> {
	const tags = await container.prisma.tag.findMany({
		where: isNullishOrEmpty(query)
			? { guildId }
			: { guildId, OR: [{ name: { startsWith: query } }, { aliases: { some: { name: { startsWith: query } } } }] },
		select: { id: true, name: true, content: true, aliases: true, uses: true }
	});

	const entries = [] as TagSearchResult[];
	for (const value of tags) {
		const score = getSearchScore(query, value);
		if (score !== 0) entries.push({ score, value });
	}

	return entries.sort((a, b) => b.score - a.score || b.value.uses - a.value.uses).slice(0, 25);
}

function getSearchScore(query: string, tag: Pick<Tag, 'id' | 'name' | 'content' | 'uses'> & { aliases: TagAlias[] }) {
	if (tag.name === query) return 1;

	let score = tag.name.startsWith(query) ? query.length / tag.name.length : 0;
	for (const alias of tag.aliases) {
		if (alias.name === query) return 1;
		if (alias.name.includes(query)) score = Math.max(score, query.length / alias.name.length);
	}

	if (tag.content.startsWith(query)) score = Math.max(score, query.length / tag.content.length);
	return score;
}

export function getTag<A>(guildId: bigint, query: string, aliases?: A): Promise<(A extends true ? FullTag : Tag) | null>;
export function getTag(guildId: bigint, query: string, aliases = false) {
	return container.prisma.tag.findFirst({
		where: { guildId, OR: [{ name: query }, { aliases: { some: { name: query } } }] },
		include: aliases ? { aliases: true } : undefined
	});
}

type FullTag = Tag & { aliases: TagAlias[] };

export function makeTagChoices(results: readonly TagSearchResult[]): APIApplicationCommandOptionChoice[] {
	return results.map((result) => ({
		name: cut(`${result.score === 1 ? '⭐' : '📄'} ${result.value.name} — ${result.value.content}`, 100),
		value: result.value.name
	}));
}

export interface TagSearchResult {
	score: number;
	value: Pick<Tag, 'id' | 'name' | 'content' | 'uses'>;
}
