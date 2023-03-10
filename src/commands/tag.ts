import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { getTag, makeTagChoices, searchTag } from '#lib/utilities/tags';
import { EmbedBuilder, userMention } from '@discordjs/builders';
import type { Tag } from '@prisma/client';
import { isNullish } from '@sapphire/utilities';
import { Command, RegisterCommand, TransformedArguments, type AutocompleteInteractionArguments } from '@skyra/http-framework';
import { applyLocalizedBuilder, resolveKey, resolveUserKey } from '@skyra/http-framework-i18n';
import { MessageFlags, type APIAllowedMentions } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.Tag.RootName, LanguageKeys.Commands.Tag.RootDescription)
		.addStringOption((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.Tag.OptionsName).setAutocomplete(true).setRequired(true))
		.addBooleanOption((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.Tag.OptionsHide))
		.addUserOption((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.Tag.OptionsTarget))
		.setDMPermission(false)
)
export class UserCommand extends Command {
	public override async autocompleteRun(interaction: Command.AutocompleteInteraction, options: AutocompleteInteractionArguments<Options>) {
		const results = await searchTag(BigInt(interaction.guildId!), options.name);
		return interaction.reply({ choices: makeTagChoices(results) });
	}

	public override async chatInputRun(interaction: Command.ChatInputInteraction, options: Options) {
		const tag = await getTag(BigInt(interaction.guildId!), options.name);
		if (isNullish(tag)) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.Tag.Unknown);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const response = await interaction.reply({
			content: this.getContent(interaction, options, tag),
			embeds: this.getEmbeds(tag),
			flags: this.getFlags(options),
			allowed_mentions: this.getAllowedMentions(options)
		});

		// Increase the use count:
		await this.container.prisma.tag.update({ where: { id: tag.id }, data: { uses: { increment: 1 } }, include: null });
		return response;
	}

	private getContent(interaction: Command.ChatInputInteraction, options: Options, tag: Tag) {
		const hide = options.hide ?? false;
		if (options.target && !hide) {
			const header = resolveKey(interaction, LanguageKeys.Commands.Tag.Target, { user: userMention(options.target.user.id) });
			return tag.embed ? header : `${header}\n${tag.content}`;
		}

		return tag.embed ? '' : tag.content;
	}

	private getEmbeds(tag: Tag) {
		return tag.embed ? [new EmbedBuilder().setColor(tag.embedColor).setDescription(tag.content).toJSON()] : undefined;
	}

	private getFlags(options: Options) {
		return options.hide === true ? MessageFlags.Ephemeral : undefined;
	}

	private getAllowedMentions(options: Options) {
		return { roles: [], users: options.target ? [options.target.user.id] : [] } satisfies APIAllowedMentions;
	}
}

interface Options {
	name: string;
	hide?: boolean;
	target?: TransformedArguments.User;
}
