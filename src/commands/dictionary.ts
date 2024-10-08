import { PathSrc } from '#lib/common/constants';
import { escapeInlineCode } from '#lib/common/escape';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { DictionaryNoResultsError } from '#lib/utilities/DictionaryNoResultsError';
import { Time } from '@sapphire/duration';
import { Result, none, some } from '@sapphire/result';
import { Command, RegisterCommand, type MessageResponseOptions } from '@skyra/http-framework';
import { applyLocalizedBuilder, getSupportedLanguageT, type TFunction } from '@skyra/http-framework-i18n';
import { Json, isAbortError, safeTimedFetch, type FetchError } from '@skyra/safe-fetch';
import { ApplicationIntegrationType, InteractionContextType, MessageFlags } from 'discord-api-types/v10';
import { readFile } from 'node:fs/promises';

const Root = LanguageKeys.Commands.Dictionary;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription) //
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
		.addStringOption((builder) => applyLocalizedBuilder(builder, Root.OptionsInput).setMinLength(2).setMaxLength(45).setRequired(true))
)
export class UserCommand extends Command {
	public override async chatInputRun(interaction: Command.ChatInputInteraction, args: Options) {
		const input = args.input.toLowerCase();
		const result = await this.makeRequest(input);

		const t = getSupportedLanguageT(interaction);

		const body = result
			.mapInto((values) => {
				const firstValue = values.at(0);
				if (firstValue) return Result.ok(firstValue);
				return Result.err(new DictionaryNoResultsError());
			})
			.match({
				ok: (value) => this.handleOk(t, input, value),
				err: (error) => this.handleError(t, input, error)
			});
		return interaction.reply(body);
	}

	private handleOk(t: TFunction, input: string, result: DictionaryAPIResult) {
		let lines = [t(Root.ContentTitle, { value: escapeInlineCode(result.word) })];

		if (result.phonetic) lines.push(t(Root.ContentPhonetic, { value: result.phonetic }));

		let escapeOutOfLoop = false;
		for (const [index, meaning] of result.meanings.entries()) {
			if (escapeOutOfLoop) break;

			this.makeContent(t, meaning, index).inspect((content) => {
				const newLines = [...lines, content];
				if (newLines.join('\n').length > 2000) {
					escapeOutOfLoop = true;
					return;
				}

				lines = newLines;
				return lines;
			});
		}

		return { content: lines.join('\n'), flags: BlockList.has(input) ? MessageFlags.Ephemeral : undefined } satisfies MessageResponseOptions;
	}

	private handleError(t: TFunction, input: string, error: FetchError | DictionaryNoResultsError) {
		if (error instanceof DictionaryNoResultsError) {
			return {
				content: t(Root.FetchNoResults, { value: escapeInlineCode(input) }),
				flags: MessageFlags.Ephemeral
			} satisfies MessageResponseOptions;
		}

		return {
			content: t(this.getErrorKey(error), { value: escapeInlineCode(input) }),
			flags: MessageFlags.Ephemeral
		} satisfies MessageResponseOptions;
	}

	private getErrorKey(error: FetchError) {
		if (isAbortError(error)) return Root.FetchAbort;
		if (error.code === 404) return Root.FetchNoResults;
		if (error.code === 429) {
			this.container.logger.error('[DICTIONARYAPI] 429: Request surpassed its rate limit');
			return Root.FetchRateLimited;
		}
		if (error.code >= 500) {
			this.container.logger.warn('[DICTIONARYAPI] %d: Received a server error', error.code);
			return Root.FetchServerError;
		}

		this.container.logger.warn('[DICTIONARYAPI] %d: Received an unknown error status code', error.code);
		return Root.FetchUnknownError;
	}

	private makeContent(t: TFunction, meaning: DictionaryAPIMeaning, index: number) {
		const meaningParts: string[] = [];

		meaningParts.push(t(Root.ContentLexicalCategory, { value: meaning.partOfSpeech, index: index + 1 }));

		for (const [subIndex, definition] of meaning.definitions.entries()) {
			meaningParts.push(
				t(Root.ContentDefinition, {
					value: definition.definition,
					index: index + 1,
					subIndex: subIndex + 1
				})
			);

			if (definition.example) {
				meaningParts.push('', t(Root.ContentExample, { value: definition.example }));
			}
		}

		return meaningParts.length ? some(meaningParts.join('\n')) : none;
	}

	private makeRequest(input: string) {
		return Json<DictionaryAPIResult[]>(
			safeTimedFetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(input)}`, Time.Second * 2, {
				headers: { Accept: 'application/json' }
			})
		);
	}
}

const PathBlockList = new URL('./generated/data/dictionary-profanity.json', PathSrc);
const BlockList = new Set(JSON.parse(await readFile(PathBlockList, 'utf8')) as string[]);

interface Options {
	input: string;
}

interface DictionaryAPIResult {
	word: string;
	phonetic: string;
	phonetics: DictionaryAPIPhonetic[];
	origin?: string;
	meanings: DictionaryAPIMeaning[];
	license?: License;
	sourceUrls?: string[];
}

interface License {
	name: string;
	url: string;
}

interface DictionaryAPIMeaning {
	partOfSpeech: string;
	definitions: DictionaryAPIDefinition[];
}

interface DictionaryAPIDefinition {
	definition: string;
	example?: string;
	synonyms: string[];
	antonyms: string[];
}

interface DictionaryAPIPhonetic {
	text: string;
	audio?: string;
	sourceUrl?: string;
	license?: License;
}
