import { BrandingColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { EmbedBuilder, hyperlink, inlineCode } from '@discordjs/builders';
import { Time } from '@sapphire/duration';
import { isNullishOrEmpty } from '@sapphire/utilities';
import { Command, RegisterCommand, type AutocompleteInteractionArguments } from '@skyra/http-framework';
import { applyLocalizedBuilder, resolveKey, resolveUserKey } from '@skyra/http-framework-i18n';
import { Json, safeTimedFetch } from '@skyra/safe-fetch';
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
	public override async autocompleteRun(interaction: Command.AutocompleteInteraction, options: AutocompleteInteractionArguments<Options>) {
		if (isNullishOrEmpty(options.input)) {
			return interaction.replyEmpty();
		}

		const data = await this.search(options.input);
		return interaction.reply({ choices: data.map((entry) => ({ name: entry, value: entry })) });
	}

	public override async chatInputRun(interaction: Command.ChatInputInteraction, options: Options) {
		const data = await this.query(options.input);
		if (data === null) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.Wikipedia.NoResults);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const embed = new EmbedBuilder() //
			.setColor(BrandingColors.Primary)
			.setTitle(data.title);
		if (data.type === QueryCacheType.Page) {
			embed.setURL(UserCommand.titleToUrl(data.title)).setDescription(data.extract);
		} else {
			const url = UserCommand.titleToUrl(data.title, data.iw);
			const link = hyperlink(inlineCode(`${data.iw}.wikipedia.org`), url);
			embed.setURL(url).setDescription(resolveKey(interaction, LanguageKeys.Commands.Wikipedia.InterWiki, { link }));
		}

		return interaction.reply({ embeds: [embed.toJSON()] });
	}

	private async search(input: string): Promise<SearchCacheValue> {
		const key = `wiki:search:${input.toLowerCase()}`;
		const cached = await this.container.redis.get(key);
		if (!isNullishOrEmpty(cached)) return JSON.parse(cached);

		const url = new URL('https://en.wikipedia.org/w/api.php');
		url.searchParams.append('action', 'opensearch');
		url.searchParams.append('search', input);
		const result = await Json<SearchResult>(safeTimedFetch(url, Time.Second * 2));

		return result
			.map((results) => results[1])
			.inspectAsync((results) => this.container.redis.psetex(key, Time.Hour, JSON.stringify(results)))
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

		const result = await Json<QueryResult>(safeTimedFetch(url, Time.Second * 2));
		const entry = result.match({
			ok: (value): QueryCacheValue | null => {
				if (UserCommand.isPage(value.query)) {
					const page = value.query.pages[value.query.pageids[0]];
					return { type: QueryCacheType.Page, id: page.pageid, title: page.title, extract: page.extract };
				}

				if (UserCommand.isInterWiki(value.query)) {
					const page = value.query.interwiki[0];
					return { type: QueryCacheType.InterWiki, iw: page.iw, title: page.title };
				}

				return null;
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

	private static isPage(query: QueryResultQuery): query is QueryResultQueryPages {
		return 'pageids' in query && query.pageids[0] !== '-1';
	}

	private static isInterWiki(query: QueryResultQuery): query is QueryResultQueryInterWiki {
		return 'interwiki' in query;
	}

	private static titleToUrl(title: string, lang = 'en'): string {
		return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
	}
}

interface Options {
	input: string;
}

type SearchCacheValue = readonly string[];
type QueryCacheValue = QueryCacheValuePage | QueryCacheValueInterWiki;
enum QueryCacheType {
	Page,
	InterWiki
}

interface QueryCacheValuePage {
	readonly type: QueryCacheType.Page;
	readonly id: number;
	readonly title: string;
	readonly extract: string;
}

interface QueryCacheValueInterWiki {
	readonly type: QueryCacheType.InterWiki;
	readonly iw: string;
	readonly title: string;
}

type SearchResult = [name: string, results: string[], _: ''[], links: string[]];

interface QueryResult {
	batchcomplete: '';
	query: QueryResultQuery;
}

type QueryResultQuery = QueryResultQueryPages | QueryResultQueryInterWiki | QueryResultQueryMissing;

interface QueryResultQueryPages {
	pageids: [`${bigint}`];
	pages: Record<`${bigint}`, { pageid: number; ns: 0; title: string; extract: string }>;
}

interface QueryResultQueryInterWiki {
	interwiki: QueryResultQueryInterWikiEntry[];
}

interface QueryResultQueryMissing {
	pageids: ['-1'];
	pages: Record<'-1', { ns: 0; title: string; missing: '' }>;
}

interface QueryResultQueryInterWikiEntry {
	iw: string;
	title: string;
}