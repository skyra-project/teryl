import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import type { YouTubeResult, YouTubeResultId } from '#lib/types/youtube';
import { getLinkFromResultId, getSelectMenuValue } from '#lib/utilities/youtube';
import { ActionRowBuilder, StringSelectMenuBuilder } from '@discordjs/builders';
import { cutText } from '@sapphire/utilities';
import { envParseString } from '@skyra/env-utilities';
import { Command, MakeArguments, MessageResponseOptions, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, resolveUserKey } from '@skyra/http-framework-i18n';
import { FetchError, isAbortError, Json, safeTimedFetch } from '@skyra/safe-fetch';
import { APISelectMenuOption, MessageFlags } from 'discord-api-types/v10';
import he from 'he';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.YouTube.RootName, LanguageKeys.Commands.YouTube.RootDescription).addStringOption((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.YouTube.OptionsQuery).setRequired(true)
	)
)
export class UserCommand extends Command {
	public override async chatInputRun(interaction: Command.ChatInputInteraction, options: Options) {
		const result = await this.query(options.query);
		const body = result.match({
			ok: (result) => this.handleOk(interaction, result),
			err: (error) => this.handleError(interaction, error)
		});
		return interaction.reply(body);
	}

	private query(query: string) {
		const url = new URL('https://youtube.googleapis.com/youtube/v3/search');
		url.searchParams.append('part', 'snippet');
		url.searchParams.append('safeSearch', 'strict');
		url.searchParams.append('q', query);
		url.searchParams.append('key', envParseString('GOOGLE_API_TOKEN'));

		return Json<YouTubeResult>(safeTimedFetch(url, 2000));
	}

	private handleOk(interaction: Command.ChatInputInteraction, result: YouTubeResult): MessageResponseOptions {
		let first: YouTubeResultId | null = null;
		const options: APISelectMenuOption[] = [];
		for (const item of result.items) {
			getSelectMenuValue(item.id).inspect((value) => {
				first ??= item.id;
				options.push({
					label: cutText(he.decode(item.snippet.channelTitle), 25),
					description: cutText(he.decode(item.snippet.title), 50),
					value
				});
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

	private handleError(interaction: Command.ChatInputInteraction, error: FetchError): MessageResponseOptions {
		return { content: this.handleErrorGetContent(interaction, error), flags: MessageFlags.Ephemeral };
	}

	private handleErrorGetContent(interaction: Command.ChatInputInteraction, error: FetchError): string {
		if (isAbortError(error)) return resolveUserKey(interaction, LanguageKeys.Commands.YouTube.AbortError);

		this.container.logger.error('[YouTube] Unknown Error', error);
		return resolveUserKey(interaction, LanguageKeys.Commands.YouTube.UnknownError);
	}
}

type Options = MakeArguments<{
	query: 'string';
}>;
