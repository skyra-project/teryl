import { PathSrc } from '#lib/common/constants';
import { escapeInlineCode } from '#lib/common/escape';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { blockQuote } from '@discordjs/builders';
import { Time } from '@sapphire/duration';
import { none, some } from '@sapphire/result';
import { envParseString } from '@skyra/env-utilities';
import { Command, RegisterCommand, type MessageResponseOptions } from '@skyra/http-framework';
import { applyLocalizedBuilder, getSupportedLanguageT, type TFunction } from '@skyra/http-framework-i18n';
import { Json, isAbortError, safeTimedFetch, type FetchError } from '@skyra/safe-fetch';
import { MessageFlags } from 'discord-api-types/v10';
import { readFile } from 'node:fs/promises';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.Dictionary.RootName, LanguageKeys.Commands.Dictionary.RootDescription).addStringOption(
		(builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.Dictionary.OptionsInput).setMinLength(2).setMaxLength(45).setRequired(true)
	)
)
export class UserCommand extends Command {
	public override async chatInputRun(interaction: Command.ChatInputInteraction, args: Options) {
		const input = args.input.toLowerCase();
		const result = await this.makeRequest(input);

		const t = getSupportedLanguageT(interaction);
		const body = result.match({
			ok: (value) => this.handleOk(t, input, value),
			err: (error) => this.handleError(t, input, error)
		});
		return interaction.reply(body);
	}

	private handleOk(t: TFunction, input: string, result: OwlbotResult) {
		const lines = [t(LanguageKeys.Commands.Dictionary.ContentTitle, { value: escapeInlineCode(result.word) })];
		this.makeHeader(t, result).inspect((header) => lines.push(header));
		lines.push(blockQuote(result.definitions[0].definition));
		return { content: lines.join('\n'), flags: BlockList.has(input) ? MessageFlags.Ephemeral : undefined } satisfies MessageResponseOptions;
	}

	private handleError(t: TFunction, input: string, error: FetchError) {
		return {
			content: t(this.getErrorKey(error), { value: escapeInlineCode(input) }),
			flags: MessageFlags.Ephemeral
		} satisfies MessageResponseOptions;
	}

	private getErrorKey(error: FetchError) {
		if (isAbortError(error)) return LanguageKeys.Commands.Dictionary.FetchAbort;
		if (error.code === 401) {
			this.container.logger.fatal('[OWLBOT] 401: Authorization failed');
			return LanguageKeys.Commands.Dictionary.FetchAuthorizationFailed;
		}
		if (error.code === 404) return LanguageKeys.Commands.Dictionary.FetchNoResults;
		if (error.code === 429) {
			this.container.logger.error('[OWLBOT] 429: Request surpassed its rate limit');
			return LanguageKeys.Commands.Dictionary.FetchRateLimited;
		}
		if (error.code >= 500) {
			this.container.logger.warn('[OWLBOT] %d: Received a server error', error.code);
			return LanguageKeys.Commands.Dictionary.FetchServerError;
		}

		this.container.logger.warn('[OWLBOT] %d: Received an unknown error status code', error.code);
		return LanguageKeys.Commands.Dictionary.FetchUnknownError;
	}

	private makeHeader(t: TFunction, result: OwlbotResult) {
		const [definition] = result.definitions;

		const header: string[] = [];
		if (result.pronunciation) header.push(t(LanguageKeys.Commands.Dictionary.ContentPronunciation, { value: result.pronunciation }));
		if (definition.type) header.push(t(LanguageKeys.Commands.Dictionary.ContentType, { value: definition.type }));
		if (definition.emoji) header.push(t(LanguageKeys.Commands.Dictionary.ContentEmoji, { value: definition.emoji }));

		return header.length ? some(header.join(' • ')) : none;
	}

	private makeRequest(input: string) {
		return Json<OwlbotResult>(
			safeTimedFetch(`https://owlbot.info/api/v4/dictionary/${encodeURIComponent(input)}`, Time.Second * 2, {
				headers: { Accept: 'application/json', Authorization: `Token ${envParseString('OWLBOT_TOKEN')}` }
			})
		);
	}
}

const PathBlockList = new URL('./generated/data/dictionary-profanity.json', PathSrc);
const BlockList = new Set(JSON.parse(await readFile(PathBlockList, 'utf8')) as string[]);

interface Options {
	input: string;
}

interface OwlbotResult {
	definitions: readonly OwlbotDefinition[];
	word: string;
	pronunciation: string | null;
}

interface OwlbotDefinition {
	type: string | null;
	definition: string;
	example: string | null;
	image_url: string | null;
	emoji: string | null;
}
