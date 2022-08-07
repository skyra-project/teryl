import { BrandingColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { EmbedBuilder } from '@discordjs/builders';
import { Result } from '@sapphire/result';
import { Time } from '@sapphire/time-utilities';
import { isNullishOrEmpty } from '@sapphire/utilities';
import { Command, RegisterCommand, type AutocompleteInteractionArguments } from '@skyra/http-framework';
import { applyLocalizedBuilder, resolveUserKey } from '@skyra/http-framework-i18n';
import { MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.Wikipedia.RootName, LanguageKeys.Commands.Wikipedia.RootDescription) //
		.addStringOption((builder) =>
			applyLocalizedBuilder(builder, LanguageKeys.Commands.Wikipedia.OptionsInput) //
				.setAutocomplete(true)
				.setRequired(true)
		)
)
export class UserCommand extends Command {
	public override async autocompleteRun(_: Command.AutocompleteInteraction, options: AutocompleteInteractionArguments<Options>) {
		if (isNullishOrEmpty(options.input)) {
			return this.autocompleteNoResults();
		}

		const data = await this.search(options.input);
		return this.autocomplete({ choices: data.map((entry) => ({ name: entry, value: entry })) });
	}

	public override async chatInputRun(interaction: Command.Interaction, options: Options): Command.AsyncResponse {
		const data = await this.query(options.input);
		if (data === null) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.Wikipedia.NoResults);
			return this.message({ content, flags: MessageFlags.Ephemeral });
		}

		const embed = new EmbedBuilder()
			.setColor(BrandingColors.Primary)
			.setTitle(data.title)
			.setURL(UserCommand.titleToUrl(data.title))
			.setDescription(data.extract);

		return this.message({ embeds: [embed.toJSON()] });
	}

	private async search(input: string): Promise<SearchCacheValue> {
		const key = `wiki:search:${input.toLowerCase()}`;
		const cached = await this.container.redis.get(key);
		if (!isNullishOrEmpty(cached)) return JSON.parse(cached);

		const url = new URL('https://en.wikipedia.org/w/api.php');
		url.searchParams.append('action', 'opensearch');
		url.searchParams.append('search', input);
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), Time.Second * 2);
		const result = await Result.fromAsync(fetch(url, { signal: controller.signal }).then((result) => result.json() as Promise<SearchResult>));
		clearTimeout(timer);

		return result
			.map((results) => results[1])
			.inspectAsync((results) => this.container.redis.psetex(key, Time.Hour, JSON.stringify(results[1])))
			.then((result) => result.unwrapOr([]));
	}

	private async query(input: string): Promise<QueryCacheValue | null> {
		const key = `wiki:query:${input}`;
		const cached = await this.container.redis.get(key);
		if (!isNullishOrEmpty(cached)) return JSON.parse(cached);

		const url = new URL('https://en.wikipedia.org/w/api.php');
		url.searchParams.append('action', 'query');
		url.searchParams.append('format', 'json');
		url.searchParams.append('indexpageids', 'true');
		url.searchParams.append('redirects', 'true');
		url.searchParams.append('converttitles', 'true');
		url.searchParams.append('exlimit', '1');
		url.searchParams.append('titles', input);
		url.searchParams.append('prop', 'extracts');
		url.searchParams.append('explaintext', 'true');
		url.searchParams.append('exsectionformat', 'plain');
		url.searchParams.append('exchars', '300');

		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), Time.Second * 2);
		const result = await Result.fromAsync(fetch(url, { signal: controller.signal }).then((result) => result.json() as Promise<QueryResult>));
		clearTimeout(timer);

		const entry = result.match({
			ok: (value): QueryCacheValue | null => {
				if (!UserCommand.isSuccessfulQuery(value.query)) return null;

				const page = value.query.pages[value.query.pageids[0]];
				const entry = { id: page.pageid, title: page.title, extract: page.extract };

				return entry;
			},
			err: (error) => {
				this.container.logger.error(error);
				return null;
			}
		});

		// Write only on success
		if (result.isOk()) {
			await this.container.redis.psetex(key, Time.Hour, JSON.stringify(entry));
		}

		return entry;
	}

	private static readonly titleToUrlReplacers = {
		' ': '_',
		'(': '%28',
		')': '%29'
	} as const;

	private static isSuccessfulQuery(query: QueryResultQuerySuccess | QueryResultQueryMissing): query is QueryResultQuerySuccess {
		return query.pageids[0] !== '-1';
	}

	private static titleToUrl(title: string): string {
		const sanitized = title.replaceAll(/[ \(\)]/g, (character) => UserCommand.titleToUrlReplacers[character as ' ' | '(' | ')']);
		return `https://en.wikipedia.org/wiki/${encodeURIComponent(sanitized)}`;
	}
}

interface Options {
	input: string;
}

type SearchCacheValue = readonly string[];
interface QueryCacheValue {
	readonly id: number;
	readonly title: string;
	readonly extract: string;
}

type SearchResult = [name: string, results: string[], _: ''[], links: string[]];

interface QueryResult {
	batchcomplete: '';
	query: QueryResultQuerySuccess | QueryResultQueryMissing;
}

interface QueryResultQuerySuccess {
	pageids: [`${bigint}`];
	pages: Record<`${bigint}`, { pageid: number; ns: 0; title: string; extract: string }>;
}

interface QueryResultQueryMissing {
	pageids: ['-1'];
	pages: Record<'-1', { ns: 0; title: string; missing: '' }>;
}
