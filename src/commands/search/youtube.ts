import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import type { YouTubeResult, YouTubeResultId, YouTubeResultSnippet } from '#lib/types/youtube';
import { getLinkFromResultId, getSelectMenuValue } from '#lib/utilities/youtube';
import { ActionRowBuilder, StringSelectMenuBuilder } from '@discordjs/builders';
import { cutText, isNullishOrEmpty } from '@sapphire/utilities';
import { envParseString } from '@skyra/env-utilities';
import { Command, MessageResponseOptions, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, createSelectMenuChoiceName, resolveUserKey } from '@skyra/http-framework-i18n';
import { FetchError, isAbortError, Json, safeTimedFetch } from '@skyra/safe-fetch';
import { APISelectMenuOption, MessageFlags } from 'discord-api-types/v10';
import he from 'he';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.YouTube.RootName, LanguageKeys.Commands.YouTube.RootDescription)
		.addStringOption((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.YouTube.OptionsQuery).setRequired(true))
		.addStringOption((builder) =>
			applyLocalizedBuilder(builder, LanguageKeys.Commands.YouTube.OptionsOrder).addChoices(
				createSelectMenuChoiceName(LanguageKeys.Commands.YouTube.OptionsOrderDate, { value: 'date' }),
				createSelectMenuChoiceName(LanguageKeys.Commands.YouTube.OptionsOrderRating, { value: 'rating' }),
				createSelectMenuChoiceName(LanguageKeys.Commands.YouTube.OptionsOrderRelevance, { value: 'relevance' }),
				createSelectMenuChoiceName(LanguageKeys.Commands.YouTube.OptionsOrderTitle, { value: 'title' }),
				createSelectMenuChoiceName(LanguageKeys.Commands.YouTube.OptionsOrderVideoCount, { value: 'videoCount' }),
				createSelectMenuChoiceName(LanguageKeys.Commands.YouTube.OptionsOrderViewCount, { value: 'viewCount' })
			)
		)
		.addStringOption((builder) =>
			applyLocalizedBuilder(builder, LanguageKeys.Commands.YouTube.OptionsType).addChoices(
				createSelectMenuChoiceName(LanguageKeys.Commands.YouTube.OptionsTypeChannel, { value: 'channel' }),
				createSelectMenuChoiceName(LanguageKeys.Commands.YouTube.OptionsTypePlaylist, { value: 'playlist' }),
				createSelectMenuChoiceName(LanguageKeys.Commands.YouTube.OptionsTypeVideo, { value: 'video' })
			)
		)
)
export class UserCommand extends Command {
	public override async chatInputRun(interaction: Command.ChatInputInteraction, options: Options) {
		const result = await this.query(options);
		const body = result.match({
			ok: (result) => this.handleOk(interaction, result),
			err: (error) => this.handleError(interaction, error)
		});
		return interaction.reply(body);
	}

	private query(options: Options) {
		const url = new URL('https://youtube.googleapis.com/youtube/v3/search');
		url.searchParams.append('part', 'snippet');
		url.searchParams.append('safeSearch', 'strict');
		url.searchParams.append('maxResults', '25');
		url.searchParams.append('q', options.query);
		url.searchParams.append('key', envParseString('GOOGLE_API_TOKEN'));
		if (!isNullishOrEmpty(options.order)) url.searchParams.append('order', options.order);
		if (!isNullishOrEmpty(options.type)) url.searchParams.append('type', options.type);

		return Json<YouTubeResult>(safeTimedFetch(url, 2000));
	}

	private handleOk(interaction: Command.ChatInputInteraction, result: YouTubeResult): MessageResponseOptions {
		let first: YouTubeResultId | null = null;
		const options: APISelectMenuOption[] = [];
		for (const item of result.items) {
			getSelectMenuValue(item.id).inspect((value) => {
				options.push({
					// Handle edge case with channelTitle: ''.
					label: this.getLabel(item.snippet),
					description: cutText(he.decode(item.snippet.title), 50),
					value,
					default: first === null
				});
				first ??= item.id;
			});

			// If it reached the maximum length, break:
			if (options.length === 25) break;
		}

		if (options.length === 0) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.YouTube.NoResults);
			return { content, flags: MessageFlags.Ephemeral };
		}

		const select = new StringSelectMenuBuilder().addOptions(options).setCustomId(`youtube.${interaction.user.id}`);
		const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
		return { content: getLinkFromResultId(first!).unwrap(), components: [row.toJSON()] };
	}

	private getLabel(snippet: YouTubeResultSnippet): string {
		if (!isNullishOrEmpty(snippet.channelTitle)) return cutText(he.decode(snippet.channelTitle), 25);
		return snippet.channelId === 'UC' ? 'YouTube Music' : snippet.channelId;
	}

	private handleError(interaction: Command.ChatInputInteraction, error: FetchError): MessageResponseOptions {
		return { content: this.handleErrorGetContent(interaction, error), flags: MessageFlags.Ephemeral };
	}

	private handleErrorGetContent(interaction: Command.ChatInputInteraction, error: FetchError): string {
		if (isAbortError(error)) return resolveUserKey(interaction, LanguageKeys.Commands.YouTube.AbortError);

		this.container.logger.error('[YouTube] Unknown Error', error);
		return resolveUserKey(interaction, LanguageKeys.Commands.YouTube.UnknownError);
	}
}

interface Options {
	query: string;
	order?: string;
	type?: string;
}
