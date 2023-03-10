import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { EmbedBuilder, SlashCommandStringOption, time, TimestampStyles } from '@discordjs/builders';
import { Command, RegisterCommand, RegisterSubCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, getSupportedLanguageT, type LocalePrefixKey } from '@skyra/http-framework-i18n';
import { fetchUserFollowage, fetchUsers, TwitchBrandingColor, TwitchLogoUrl, type TwitchHelixUsersSearchResult } from '@skyra/twitch-helpers';
import { MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.Twitch.RootName, LanguageKeys.Commands.Twitch.RootDescription))
export class UserCommand extends Command {
	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Twitch.User) //
			.addStringOption(UserCommand.makeChannelOption(LanguageKeys.Commands.Twitch.UserOptionsName))
	)
	public async user(interaction: Command.ChatInputInteraction, options: UserOptions) {
		const t = getSupportedLanguageT(interaction);

		const users = await fetchUsers({ logins: [options.name] });
		if (users.isErr() || users.isOkAnd((value) => value.data.length === 0)) {
			const content = t(LanguageKeys.Commands.Twitch.UserDoesNotExist);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const [channel] = users.unwrap().data;
		const followage = await fetchUserFollowage('', channel.id);

		const titles = t(LanguageKeys.Commands.Twitch.UserEmbedTitles);

		const followers = t(LanguageKeys.Commands.Twitch.UserEmbedFieldFollowers, { value: followage.match({ ok: (v) => v.total, err: () => 0 }) });
		const views = t(LanguageKeys.Commands.Twitch.UserEmbedFieldViews, { value: channel.view_count });
		const partner = t(UserCommand.AffiliateTypes[channel.broadcaster_type]);
		const embed = new EmbedBuilder()
			.setColor(TwitchBrandingColor)
			.setAuthor({ name: channel.display_name, iconURL: TwitchLogoUrl, url: `https://twitch.tv/${channel.login}` })
			.setDescription(channel.description)
			.setThumbnail(channel.profile_image_url)
			.addFields(
				{ name: titles.followers, value: followers, inline: true },
				{ name: titles.views, value: views, inline: true },
				{ name: titles.partner, value: partner, inline: true }
			);

		return interaction.reply({ embeds: [embed.toJSON()], flags: MessageFlags.Ephemeral });
	}

	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Twitch.Followage) //
			.addStringOption(UserCommand.makeChannelOption(LanguageKeys.Commands.Twitch.FollowageOptionsUser))
			.addStringOption(UserCommand.makeChannelOption(LanguageKeys.Commands.Twitch.FollowageOptionsChannel))
	)
	public async followage(interaction: Command.ChatInputInteraction, options: FollowageOptions) {
		const t = getSupportedLanguageT(interaction);
		const users = await fetchUsers({ logins: [options.user, options.channel] });
		if (users.isErr() || users.isOkAnd((value) => value.data.length < 2)) {
			const content = t(LanguageKeys.Commands.Twitch.FollowageDoesNotExist);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		// Get the User objects for the user and channel names:
		const [user, channel] = this.resolveUsers(users.unwrap().data, options);
		const followage = await fetchUserFollowage(user.id, channel.id);
		if (followage.isErr() || followage.isOkAnd((data) => data.data.length === 0)) {
			const content = t(LanguageKeys.Commands.Twitch.FollowageDoesNotFollow, { user: user.display_name, channel: channel.display_name });
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const [entry] = followage.unwrap().data;
		const followedAt = new Date(entry.followed_at);
		const description = t(LanguageKeys.Commands.Twitch.FollowageEmbedDescription, {
			user: user.display_name,
			time: time(followedAt, TimestampStyles.LongDateTime),
			relative: time(followedAt, TimestampStyles.RelativeTime)
		});
		const embed = new EmbedBuilder()
			.setColor(TwitchBrandingColor)
			.setAuthor({ name: channel.display_name, iconURL: channel.profile_image_url, url: `https://twitch.tv/${channel.login}` })
			.setDescription(description)
			.setTimestamp();

		return interaction.reply({ embeds: [embed.toJSON()], flags: MessageFlags.Ephemeral });
	}

	/**
	 * Resolves the results in the correct order as requested. Handles an edge case where Twitch's API will swap the
	 * parameters, resulting on a confusing moment.
	 * @param results The raw results from the user search.
	 * @param options The options received in {@link #followage}.
	 * @returns The resolved users in correct order.
	 */
	private resolveUsers([user, channel]: TwitchHelixUsersSearchResult[], options: FollowageOptions) {
		return user.display_name.toLowerCase() === options.user.toLowerCase() ? [user, channel] : [channel, user];
	}

	private static readonly AffiliateTypes = {
		affiliate: LanguageKeys.Commands.Twitch.UserAffiliate,
		partner: LanguageKeys.Commands.Twitch.UserPartner,
		'': LanguageKeys.Commands.Twitch.UserNotAffiliated
	};

	private static makeChannelOption(key: LocalePrefixKey) {
		return applyLocalizedBuilder(new SlashCommandStringOption(), key).setMinLength(2).setMaxLength(20).setRequired(true);
	}
}

interface UserOptions {
	name: string;
}

interface FollowageOptions {
	user: string;
	channel: string;
}
