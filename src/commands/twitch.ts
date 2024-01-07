import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { EmbedBuilder } from '@discordjs/builders';
import { Command, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, getSupportedLanguageT } from '@skyra/http-framework-i18n';
import { TwitchBrandingColor, TwitchLogoUrl, areTwitchClientCredentialsSet, fetchUserFollowage, fetchUsers } from '@skyra/twitch-helpers';
import { MessageFlags } from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.Twitch;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription) //
		.addStringOption((builder) => applyLocalizedBuilder(builder, Root.UserOptionsName).setMinLength(2).setMaxLength(20).setRequired(true))
)
export class UserCommand extends Command {
	public constructor(context: Command.LoaderContext) {
		super(context, { enabled: areTwitchClientCredentialsSet() });
	}

	public override async chatInputRun(interaction: Command.ChatInputInteraction, options: Options) {
		const t = getSupportedLanguageT(interaction);

		const users = await fetchUsers({ logins: [options.name] });
		if (users.isErr() || users.isOkAnd((value) => value.data.length === 0)) {
			const content = t(Root.UserDoesNotExist);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const [channel] = users.unwrap().data;
		const followage = await fetchUserFollowage('', channel.id);

		const titles = t(Root.UserEmbedTitles);

		const followers = t(Root.UserEmbedFieldFollowers, { value: followage.match({ ok: (v) => v.total, err: () => 0 }) });
		const views = t(Root.UserEmbedFieldViews, { value: channel.view_count });
		const partner = t(UserCommand.AffiliateTypes[channel.broadcaster_type]);
		const embed = new EmbedBuilder()
			.setColor(TwitchBrandingColor)
			.setAuthor({ name: channel.display_name, iconURL: TwitchLogoUrl, url: `https://twitch.tv/${channel.login}` })
			.setDescription(channel.description || null)
			.setThumbnail(channel.profile_image_url)
			.addFields(
				{ name: titles.followers, value: followers, inline: true },
				{ name: titles.views, value: views, inline: true },
				{ name: titles.partner, value: partner, inline: true }
			);

		return interaction.reply({ embeds: [embed.toJSON()], flags: MessageFlags.Ephemeral });
	}

	private static readonly AffiliateTypes = {
		affiliate: Root.UserAffiliate,
		partner: Root.UserPartner,
		'': Root.UserNotAffiliated
	};
}

interface Options {
	name: string;
}
