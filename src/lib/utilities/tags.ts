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
	return container.prisma.tag.findMany({
		where: isNullishOrEmpty(query)
			? { guildId }
			: { guildId, OR: [{ name: { startsWith: query } }, { aliases: { some: { name: { startsWith: query } } } }] },
		select: { id: true, name: true },
		take: 25
	});
}

export function getTag<A>(guildId: bigint, query: string, aliases?: A): Promise<(A extends true ? FullTag : Tag) | null>;
export function getTag(guildId: bigint, query: string, aliases = false) {
	if (query.endsWith('\u200B')) {
		const id = BigInt(query.slice(query.lastIndexOf(' ') + 1, -1));
		return container.prisma.tag.findFirst({ where: { id, guildId }, include: aliases ? { aliases: true } : undefined });
	}

	return container.prisma.tag.findFirst({
		where: { guildId, OR: [{ name: query }, { aliases: { some: { name: query } } }] },
		include: aliases ? { aliases: true } : undefined
	});
}

type FullTag = Tag & { aliases: TagAlias[] };

export function makeTagChoice(tag: Pick<Tag, 'id' | 'name'>) {
	return { name: tag.name, value: `${tag.name} - ${tag.id}\u200B` } satisfies APIApplicationCommandOptionChoice;
}

export function makeTagChoices(tags: readonly Pick<Tag, 'id' | 'name'>[]) {
	return tags.map((tag) => makeTagChoice(tag));
}
