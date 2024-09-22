import { cut } from '#lib/common/strings';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import type { YouTubeResult, YouTubeResultId, YouTubeResultSnippet } from '#lib/types/youtube';
import { getLinkFromResultId, getSelectMenuValue } from '#lib/utilities/youtube';
import { ActionRowBuilder, StringSelectMenuBuilder } from '@discordjs/builders';
import { isNullishOrEmpty } from '@sapphire/utilities';
import { envParseString } from '@skyra/env-utilities';
import { Command, RegisterCommand, type MessageResponseOptions } from '@skyra/http-framework';
import { applyLocalizedBuilder, createSelectMenuChoiceName, resolveUserKey } from '@skyra/http-framework-i18n';
import { Json, isAbortError, safeTimedFetch, type FetchError } from '@skyra/safe-fetch';
import { ApplicationIntegrationType, InteractionContextType, MessageFlags, type APISelectMenuOption } from 'discord-api-types/v10';
import he from 'he';

const Root = LanguageKeys.Commands.YouTube;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription)
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
		.addStringOption((builder) => applyLocalizedBuilder(builder, Root.OptionsQuery).setRequired(true))
		.addStringOption((builder) =>
			applyLocalizedBuilder(builder, Root.OptionsOrder).addChoices(
				createSelectMenuChoiceName(Root.OptionsOrderDate, { value: 'date' }),
				createSelectMenuChoiceName(Root.OptionsOrderRating, { value: 'rating' }),
				createSelectMenuChoiceName(Root.OptionsOrderRelevance, { value: 'relevance' }),
				createSelectMenuChoiceName(Root.OptionsOrderTitle, { value: 'title' }),
				createSelectMenuChoiceName(Root.OptionsOrderVideoCount, { value: 'videoCount' }),
				createSelectMenuChoiceName(Root.OptionsOrderViewCount, { value: 'viewCount' })
			)
		)
		.addStringOption((builder) =>
			applyLocalizedBuilder(builder, Root.OptionsType).addChoices(
				createSelectMenuChoiceName(Root.OptionsTypeChannel, { value: 'channel' }),
				createSelectMenuChoiceName(Root.OptionsTypePlaylist, { value: 'playlist' }),
				createSelectMenuChoiceName(Root.OptionsTypeVideo, { value: 'video' })
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
		url.searchParams.append('safeSearch', 'moderate');
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
					description: cut(he.decode(item.snippet.title), 50),
					value,
					default: first === null
				});
				first ??= item.id;
			});

			// If we have 25 options, break the loop. There may be cases where
			// YouTube gives us more than 25 results, even when we ask for only 25.
			if (options.length === 25) break;
		}

		if (options.length === 0) {
			const content = resolveUserKey(interaction, Root.NoResults);
			return { content, flags: MessageFlags.Ephemeral };
		}

		const select = new StringSelectMenuBuilder().addOptions(options).setCustomId(`youtube.${interaction.user.id}`);
		const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
		return { content: getLinkFromResultId(first!).unwrap(), components: [row.toJSON()] };
	}

	private getLabel(snippet: YouTubeResultSnippet): string {
		if (!isNullishOrEmpty(snippet.channelTitle)) return cut(he.decode(snippet.channelTitle), 25);
		return snippet.channelId === 'UC' ? 'YouTube Music' : snippet.channelId;
	}

	private handleError(interaction: Command.ChatInputInteraction, error: FetchError): MessageResponseOptions {
		return { content: this.handleErrorGetContent(interaction, error), flags: MessageFlags.Ephemeral };
	}

	private handleErrorGetContent(interaction: Command.ChatInputInteraction, error: FetchError): string {
		if (isAbortError(error)) return resolveUserKey(interaction, Root.AbortError);

		this.container.logger.error('[YouTube] Unknown Error', error);
		return resolveUserKey(interaction, Root.UnknownError);
	}
}

interface Options {
	query: string;
	order?: string;
	type?: string;
}
