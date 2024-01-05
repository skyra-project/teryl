import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { isNsfwChannel } from '#lib/utilities/discord-utilities';
import { Collection } from '@discordjs/collection';
import { err, ok, type Result } from '@sapphire/result';
import { isNullish } from '@sapphire/utilities';
import { Command, RegisterCommand, type MakeArguments, type MessageResponseOptions } from '@skyra/http-framework';
import { applyLocalizedBuilder, resolveKey, resolveUserKey, type TypedT } from '@skyra/http-framework-i18n';
import { gray, red } from '@skyra/logger';
import { fetchRedditPosts, ForbiddenType, type CacheEntry, type CacheHit, type RedditError } from '@skyra/reddit-helpers';
import { isAbortError, type FetchError } from '@skyra/safe-fetch';
import { MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.Reddit.RootName, LanguageKeys.Commands.Reddit.RootDescription).addStringOption((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Reddit.OptionsReddit).setMinLength(3).setMaxLength(24).setRequired(true)
	)
)
export class UserCommand extends Command {
	private readonly forbidden = new Collection<string, { type: ForbiddenType; reason: string }>();

	public override async chatInputRun(interaction: Command.ChatInputInteraction, args: Options) {
		const name = UserCommand.SubRedditNameRegExp.exec(args.reddit.toLowerCase())?.[1];
		if (isNullish(name)) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.Reddit.InvalidName);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const forbidden = this.getGatedMessage(interaction, name);
		if (!isNullish(forbidden)) {
			return interaction.reply({ content: forbidden, flags: MessageFlags.Ephemeral });
		}

		const response = await fetchRedditPosts(name);
		const body = response.match({
			ok: (result) => this.handleOk(interaction, result),
			// @ts-expect-error this should be resolved when reddit-helpers is published
			err: (error) => this.handleError(interaction, name, error)
		});
		return interaction.reply(body);
	}

	private handleOk(interaction: Command.ChatInputInteraction, result: CacheHit): MessageResponseOptions {
		const response = this.handleOkGetContent(interaction, result);
		return response.match({
			ok: (post) => ({ content: resolveKey(interaction, LanguageKeys.Commands.Reddit.Post, post), allowed_mentions: { roles: [], users: [] } }),
			err: (key) => ({ content: resolveUserKey(interaction, key), flags: MessageFlags.Ephemeral })
		});
	}

	private handleOkGetContent(interaction: Command.ChatInputInteraction, result: CacheHit): Result<CacheEntry, TypedT> {
		if (result.posts.length === 0) {
			return err(result.hasNsfl ? LanguageKeys.Commands.Reddit.AllNsfl : LanguageKeys.Commands.Reddit.NoPosts);
		}

		const posts = result.hasNsfw && !isNsfwChannel(interaction.channel) ? result.posts.filter((post) => !post.nsfw) : result.posts;
		return posts.length === 0 ? err(LanguageKeys.Commands.Reddit.AllNsfw) : ok(posts[Math.floor(Math.random() * posts.length)]);
	}

	private handleError(interaction: Command.ChatInputInteraction, reddit: string, error: FetchError): MessageResponseOptions {
		return { content: this.handleErrorGetContent(interaction, reddit, error), flags: MessageFlags.Ephemeral };
	}

	private handleErrorGetContent(interaction: Command.ChatInputInteraction, reddit: string, error: FetchError) {
		if (isAbortError(error)) return resolveUserKey(interaction, LanguageKeys.Commands.Reddit.AbortError);

		const parsed = error.jsonBody as RedditError;
		switch (parsed.error) {
			case 403: {
				if (parsed.reason === 'private') return resolveUserKey(interaction, LanguageKeys.Commands.Reddit.UnavailableErrorPrivate);
				if (parsed.reason === 'gold_only') return resolveUserKey(interaction, LanguageKeys.Commands.Reddit.UnavailableErrorGoldOnly);
				if (parsed.reason === 'quarantined') {
					const reason = this.forbid(reddit, ForbiddenType.Quarantined, parsed.quarantine_message);
					return resolveUserKey(interaction, LanguageKeys.Commands.Reddit.UnavailableErrorQuarantined, { reason });
				}
				if (parsed.reason === 'gated') {
					const reason = this.forbid(reddit, ForbiddenType.Quarantined, parsed.interstitial_warning_message);
					return resolveUserKey(interaction, LanguageKeys.Commands.Reddit.UnavailableErrorGated, { reason });
				}
				break;
			}
			case 404: {
				if (!Reflect.has(parsed, 'reason')) {
					return resolveUserKey(interaction, LanguageKeys.Commands.Reddit.UnavailableErrorNotFound);
				}
				if (Reflect.get(parsed, 'reason') === 'banned') {
					return resolveUserKey(interaction, LanguageKeys.Commands.Reddit.UnavailableErrorBanned);
				}
				break;
			}
			case 451: {
				return resolveUserKey(interaction, LanguageKeys.Commands.Reddit.UnavailableForLegalReasons);
			}
			case 500: {
				return resolveUserKey(interaction, LanguageKeys.Commands.Reddit.Unavailable);
			}
		}

		this.container.logger.error('[Reddit] Unknown Error', parsed);
		return resolveUserKey(interaction, LanguageKeys.Commands.Reddit.UnknownError);
	}

	private forbid(reddit: string, type: ForbiddenType, reason: string) {
		// Some messages send with 2 empty lines, where some *may* contain an empty whitespace.
		reason = reason.replaceAll(/(?:\s*\n){3,}/g, '\n\n');
		this.container.logger.info(`[REDDIT] Forbidding ${red(reddit)}. Reason: ${gray(reason.replaceAll('\n', '\\n'))}`);
		this.forbidden.set(reddit, { type, reason });
		return reason;
	}

	private getGatedMessage(interaction: Command.ChatInputInteraction, name: string) {
		if (UserCommand.SubRedditBlockList.includes(name)) {
			return resolveUserKey(interaction, LanguageKeys.Commands.Reddit.Banned);
		}

		const entry = this.forbidden.get(name);
		if (isNullish(entry)) return null;

		switch (entry.type) {
			case ForbiddenType.Quarantined:
				return resolveUserKey(interaction, LanguageKeys.Commands.Reddit.UnavailableErrorQuarantined, { reason: entry.reason });
			case ForbiddenType.Gated:
				return resolveUserKey(interaction, LanguageKeys.Commands.Reddit.UnavailableErrorGated, { reason: entry.reason });
		}
	}

	private static readonly SubRedditBlockList = ['nsfl', 'morbidreality', 'watchpeopledie', 'fiftyfifty', 'stikk'];
	/**
	 * @see {@link https://github.com/reddit-archive/reddit/blob/753b17407e9a9dca09558526805922de24133d53/r2/r2/models/subreddit.py#L392-L408}
	 * @see {@link https://github.com/reddit-archive/reddit/blob/753b17407e9a9dca09558526805922de24133d53/r2/r2/models/subreddit.py#L114}
	 */
	private static readonly SubRedditNameRegExp = /^(?:\/?r\/)?([a-z0-9][a-z0-9_]{2,20})$/;
}

type Options = MakeArguments<{
	reddit: 'string';
}>;
