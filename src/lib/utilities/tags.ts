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
	return container.prisma.tag.findMany({
		where: isNullishOrEmpty(query)
			? { guildId }
			: { guildId, OR: [{ name: { startsWith: query } }, { aliases: { some: { name: { startsWith: query } } } }] },
		select: { id: true, name: true, content: true },
		take: 25
	});
}

export function getTag<A>(guildId: bigint, query: string, aliases?: A): Promise<(A extends true ? FullTag : Tag) | null>;
export function getTag(guildId: bigint, query: string, aliases = false) {
	return container.prisma.tag.findFirst({
		where: { guildId, OR: [{ name: query }, { aliases: { some: { name: query } } }] },
		include: aliases ? { aliases: true } : undefined
	});
}

type FullTag = Tag & { aliases: TagAlias[] };

export function makeTagChoice(tag: Pick<Tag, 'id' | 'name' | 'content'>) {
	return { name: cut(`${tag.name} — ${tag.content}`, 100), value: tag.name } satisfies APIApplicationCommandOptionChoice;
}

export function makeTagChoices(tags: readonly Pick<Tag, 'id' | 'name' | 'content'>[]) {
	return tags.map((tag) => makeTagChoice(tag));
}
