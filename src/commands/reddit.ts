import { ansi8Foreground } from '#lib/common/ansi';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { isNsfwChannel } from '#lib/utilities/discord-utilities';
import { inlineCode, unorderedList } from '@discordjs/builders';
import { Collection } from '@discordjs/collection';
import { err, ok, type Result } from '@sapphire/result';
import { isNullish } from '@sapphire/utilities';
import { Command, RegisterCommand, RegisterSubcommand, type MakeArguments, type MessageResponseOptions } from '@skyra/http-framework';
import { applyLocalizedBuilder, resolveKey, resolveUserKey, type TypedT } from '@skyra/http-framework-i18n';
import { gray, red } from '@skyra/logger';
import {
	ForbiddenType,
	RedditParseException,
	fetchRedditPost,
	fetchRedditPosts,
	getRedditRedirectPostUrl,
	type CacheEntry,
	type CacheHit,
	type RedditError
} from '@skyra/reddit-helpers';
import { isAbortError, type FetchError } from '@skyra/safe-fetch';
import { ApplicationIntegrationType, InteractionContextType, MessageFlags } from 'discord-api-types/v10';
import { inspect } from 'node:util';

const Root = LanguageKeys.Commands.Reddit;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription) //
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
)
export class UserCommand extends Command {
	private readonly forbidden = new Collection<string, { type: ForbiddenType; reason: string }>();
	private readonly LogPrefix = ansi8Foreground(202, '[\uf281 REDDIT]');

	@RegisterSubcommand((builder) =>
		applyLocalizedBuilder(builder, Root.Subreddit) //
			.addStringOption((builder) => applyLocalizedBuilder(builder, Root.OptionsReddit).setMinLength(3).setMaxLength(24).setRequired(true))
	)
	public async subreddit(interaction: Command.ChatInputInteraction, args: SubredditOptions) {
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
			err: (error) => this.handleError(interaction, name, error)
		});
		return interaction.reply(body);
	}

	@RegisterSubcommand((builder) =>
		applyLocalizedBuilder(builder, Root.Post) //
			.addStringOption((builder) => applyLocalizedBuilder(builder, Root.OptionsPost).setMinLength(10).setRequired(true))
	)
	public async post(interaction: Command.ChatInputInteraction, args: PostOptions) {
		const url = UserCommand.PostShortLinkRegExp.test(args.post) //
			? ((await getRedditRedirectPostUrl(args.post)) ?? args.post)
			: args.post;

		const match = UserCommand.SubredditAndPostRegExp.exec(url)?.groups;
		if (isNullish(match)) {
			const content = resolveUserKey(interaction, Root.InvalidPostLink, { formats: UserCommand.AllowedSubredditPostFormats });
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const { subreddit: name, key } = match;
		const forbidden = this.getGatedMessage(interaction, name);
		if (!isNullish(forbidden)) {
			return interaction.reply({ content: forbidden, flags: MessageFlags.Ephemeral });
		}

		const response = await fetchRedditPost(name, key);
		const body = response.match({
			ok: (result) => this.handleOk(interaction, result),
			err: (error) => this.handleError(interaction, name, error)
		});
		return interaction.reply(body);
	}

	private handleOk(interaction: Command.ChatInputInteraction, result: CacheHit): MessageResponseOptions {
		const response = this.handleOkGetContent(interaction, result);
		return response.match({
			ok: (post) => ({
				content: resolveKey(interaction, Root.PostResult, post),
				allowed_mentions: { roles: [], users: [] }
			}),
			err: (key) => ({ content: resolveUserKey(interaction, key), flags: MessageFlags.Ephemeral })
		});
	}

	private handleOkGetContent(interaction: Command.ChatInputInteraction, result: CacheHit): Result<CacheEntry, TypedT> {
		if (result.posts.length === 0) {
			return err(result.hasNsfl ? Root.AllNsfl : Root.NoPosts);
		}

		const posts = result.hasNsfw && !isNsfwChannel(interaction.channel) ? result.posts.filter((post) => !post.nsfw) : result.posts;
		return posts.length === 0 ? err(Root.AllNsfw) : ok(posts[Math.floor(Math.random() * posts.length)]);
	}

	private handleError(interaction: Command.ChatInputInteraction, reddit: string, error: FetchError | RedditParseException): MessageResponseOptions {
		return { content: this.handleErrorGetContent(interaction, reddit, error), flags: MessageFlags.Ephemeral };
	}

	private handleErrorGetContent(interaction: Command.ChatInputInteraction, reddit: string, error: FetchError | RedditParseException): string {
		if (isAbortError(error)) return resolveUserKey(interaction, Root.AbortError);

		if (error instanceof RedditParseException) {
			return resolveUserKey(interaction, Root.ParsePostException);
		}

		let errorBody: RedditError;
		try {
			errorBody = error.jsonBody as RedditError;
		} catch (parseError) {
			this.container.logger.error(`${this.LogPrefix} [${error.code}] ${error.url}\nBody: ${red(error.body)}\nError: ${inspect(parseError)}`);
			return resolveUserKey(interaction, Root.UnknownError);
		}

		return this.handleRedditError(interaction, reddit, errorBody);
	}

	private handleRedditError(interaction: Command.ChatInputInteraction, reddit: string, errorBody: RedditError): string {
		switch (errorBody.error) {
			case 403: {
				if (errorBody.reason === 'private') return resolveUserKey(interaction, Root.UnavailableErrorPrivate);
				if (errorBody.reason === 'gold_only') return resolveUserKey(interaction, Root.UnavailableErrorGoldOnly);
				if (errorBody.reason === 'quarantined') {
					const reason = this.forbid(reddit, ForbiddenType.Quarantined, errorBody.quarantine_message);
					return resolveUserKey(interaction, Root.UnavailableErrorQuarantined, { reason });
				}
				if (errorBody.reason === 'gated') {
					const reason = this.forbid(reddit, ForbiddenType.Quarantined, errorBody.interstitial_warning_message);
					return resolveUserKey(interaction, Root.UnavailableErrorGated, { reason });
				}
				break;
			}
			case 404: {
				if (!Reflect.has(errorBody, 'reason')) {
					return resolveUserKey(interaction, Root.UnavailableErrorNotFound);
				}
				if (Reflect.get(errorBody, 'reason') === 'banned') {
					return resolveUserKey(interaction, Root.UnavailableErrorBanned);
				}
				break;
			}
			case 451: {
				return resolveUserKey(interaction, Root.UnavailableForLegalReasons);
			}
			case 500: {
				return resolveUserKey(interaction, Root.Unavailable);
			}
		}

		this.container.logger.error(`${this.LogPrefix} Unknown Error`, errorBody);
		return resolveUserKey(interaction, Root.UnknownError);
	}

	private forbid(reddit: string, type: ForbiddenType, reason: string) {
		// Some messages send with 2 empty lines, where some *may* contain an empty whitespace.
		reason = reason.replaceAll(/(?:\s*\n){3,}/g, '\n\n');
		this.container.logger.info(`${this.LogPrefix} Forbidding ${red(reddit)}. Reason: ${gray(reason.replaceAll('\n', '\\n'))}`);
		this.forbidden.set(reddit, { type, reason });
		return reason;
	}

	private getGatedMessage(interaction: Command.ChatInputInteraction, name: string) {
		if (UserCommand.SubRedditBlockList.includes(name)) {
			return resolveUserKey(interaction, Root.Banned);
		}

		const entry = this.forbidden.get(name);
		if (isNullish(entry)) return null;

		switch (entry.type) {
			case ForbiddenType.Quarantined:
				return resolveUserKey(interaction, Root.UnavailableErrorQuarantined, { reason: entry.reason });
			case ForbiddenType.Gated:
				return resolveUserKey(interaction, Root.UnavailableErrorGated, { reason: entry.reason });
		}
	}

	private static readonly SubRedditBlockList = ['nsfl', 'morbidreality', 'watchpeopledie', 'fiftyfifty', 'stikk'];

	/**
	 * @see {@link https://github.com/reddit-archive/reddit/blob/753b17407e9a9dca09558526805922de24133d53/r2/r2/models/subreddit.py#L392-L408}
	 * @see {@link https://github.com/reddit-archive/reddit/blob/753b17407e9a9dca09558526805922de24133d53/r2/r2/models/subreddit.py#L114}
	 *
	 * Allowed formats:
	 *
	 * - `{prefix}{subreddit}`
	 * - `https://www.reddit.com/r/{subreddit}`
	 *
	 * Being `{prefix}` either an empty string, `r/`, or `/r/`.
	 */
	private static readonly SubRedditNameRegExp = /(?:\/?r\/)?(?<subreddit>[a-zA-Z0-9]\w{2,20})$/;

	/**
	 * An alteration of {@link SubRedditNameRegExp} that also captures the post key. Allowed formats:
	 *
	 * - `{prefix}{subreddit}/comments/{code}`
	 * - `https://www.reddit.com/r/{subreddit}/comments/{code}/{name}`
	 *
	 * Being `{prefix}` either an empty string, `r/`, or `/r/`.
	 */
	private static readonly SubredditAndPostRegExp = /(?:\/?r\/)?(?<subreddit>[a-zA-Z0-9]\w{2,20})\/comments\/(?<key>[a-zA-Z0-9]{6,})/;

	/**
	 * A regex that matches when a post short link is provided. Allowed formats:
	 *
	 * - `{prefix}{subreddit}/s/{code}`
	 * - `https://www.reddit.com/r/{subreddit}/s/{code}`
	 *
	 * Being `{prefix}` either an empty string, `r/`, or `/r/`.
	 */
	private static readonly PostShortLinkRegExp = /(?:\/?r\/)?[a-zA-Z0-9]\w{2,20}\/s\/[a-zA-Z0-9]{6,}/;

	/**
	 * A formatted string that contains the allowed subreddit post formats.
	 */
	private static readonly AllowedSubredditPostFormats = unorderedList([
		inlineCode('https://www.reddit.com/r/{subreddit}/comments/{code}'),
		inlineCode('https://www.reddit.com/r/{subreddit}/s/{code}')
	]);
}

type SubredditOptions = MakeArguments<{
	reddit: 'string';
}>;

type PostOptions = MakeArguments<{
	post: 'string';
}>;
