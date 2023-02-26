import { escapeCodeBlock } from '#lib/common/escape';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { parseColor } from '#lib/utilities/color';
import { DefaultLimits, fetchLimits } from '#lib/utilities/ring';
import { getTag, makeTagChoices, sanitizeTagName, searchTag } from '#lib/utilities/tags';
import { ActionRowBuilder, codeBlock, inlineCode, SlashCommandBooleanOption, SlashCommandStringOption, TextInputBuilder } from '@discordjs/builders';
import { err, ok, Result } from '@sapphire/result';
import { cutText, isNullish, isNullishOrEmpty } from '@sapphire/utilities';
import { Command, RegisterCommand, RegisterSubCommand, type AutocompleteInteractionArguments } from '@skyra/http-framework';
import { applyLocalizedBuilder, getSupportedUserLanguageT, resolveUserKey, type TypedFT, type TypedT, type Value } from '@skyra/http-framework-i18n';
import { isAbortError } from '@skyra/safe-fetch';
import { MessageFlags, PermissionFlagsBits, TextInputStyle } from 'discord-api-types/v10';

/**
 * The content's max length is set to 4096, which is exactly 2048 * 2, however, we still set limits internally:
 * - ≤2048 (embed: true)
 * - ≤2000 (embed: false)
 *
 * Said limits are measured in code points, not characters, matching the checks the Discord API does. For reference:
 * - 'a'.repeat(2000);
 *   str.length     : 2000
 *   [...str].length: 2000
 *
 * - '🔥'.repeat(2000);
 *   str.length     : 4000
 *   [...str].length: 2000
 */
const MaximumContentLength = 4096;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.ManageTag.RootName, LanguageKeys.Commands.ManageTag.RootDescription)
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
)
export class UserCommand extends Command {
	public override async autocompleteRun(interaction: Command.AutocompleteInteraction, options: AutocompleteInteractionArguments<Options>) {
		const name = sanitizeTagName(options.name);
		const tags = options.name.length > 0 && name === null ? [] : await searchTag(this.getGuildId(interaction), name);
		return interaction.reply({ choices: makeTagChoices(tags) });
	}

	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.ManageTag.Add)
			.addStringOption(makeNameOption())
			.addStringOption(makeContentOption())
			.addBooleanOption(makeEmbedOption())
			.addStringOption(makeEmbedColorOption())
	)
	public async add(interaction: Command.ChatInputInteraction, options: AddOptions) {
		const name = sanitizeTagName(options.name);
		if (isNullishOrEmpty(name)) return this.replyInvalidName(interaction, options.name);

		const guildId = this.getGuildId(interaction);
		const existing = await getTag(guildId, name);
		if (!isNullish(existing)) return this.replyLocalizedEphemeral(interaction, LanguageKeys.Commands.ManageTag.Exists, inlineCode(name));

		const countResult = await this.canAddMoreTags(interaction, guildId);
		if (countResult.isErr()) return this.replyEphemeral(interaction, countResult.unwrapErr());

		const embedColorResult = this.getEmbedColor(interaction, options);
		if (embedColorResult.isErr()) return this.replyEphemeral(interaction, embedColorResult.unwrapErr());

		// Default `embed` to `true` if `embed-color` is set.
		const embed = options.embed ?? !isNullishOrEmpty(options['embed-color']);
		const embedColor = embedColorResult.unwrap();
		if (isNullishOrEmpty(options.content)) {
			const t = getSupportedUserLanguageT(interaction);
			const row = new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId('content')
					.setLabel(t(LanguageKeys.Commands.ManageTag.ModalContent))
					.setRequired(true)
					.setStyle(TextInputStyle.Paragraph)
			);
			return interaction.showModal({
				title: t(LanguageKeys.Commands.ManageTag.Modal),
				components: [row.toJSON()],
				custom_id: `tag.add.${embed ? 1 : 0}.${embedColor}.${name}`
			});
		}

		const lengthLimit = embed ? 2048 : 2000;
		if ([...options.content].length > lengthLimit) {
			return this.replyLocalizedEphemeral(interaction, LanguageKeys.Commands.ManageTag.TooManyCharacters, lengthLimit);
		}

		await this.container.prisma.tag.create({ data: { name, content: options.content, embed, embedColor, guildId } });
		return this.replyLocalizedEphemeral(interaction, LanguageKeys.Commands.ManageTag.AddSuccess, inlineCode(name));
	}

	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.ManageTag.Remove).addStringOption(makeNameOption().setAutocomplete(true))
	)
	public async remove(interaction: Command.ChatInputInteraction, options: Options) {
		const guildId = this.getGuildId(interaction);
		const existing = await getTag(guildId, options.name);
		if (isNullish(existing)) return this.replyLocalizedEphemeral(interaction, LanguageKeys.Commands.ManageTag.Unknown, inlineCode(options.name));

		const result = await Result.fromAsync(this.container.prisma.tag.delete({ where: { id: existing.id } }));
		const content = result.match({
			ok: (tag) => resolveUserKey(interaction, LanguageKeys.Commands.ManageTag.RemoveSuccess, { value: inlineCode(tag.name) }),
			err: () => LanguageKeys.Commands.ManageTag.Unknown
		});
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	@RegisterSubCommand((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.ManageTag.RemoveAll))
	public async removeAll(interaction: Command.ChatInputInteraction) {
		const result = await this.container.prisma.tag.deleteMany({ where: { guildId: this.getGuildId(interaction) } });

		return result.count === 0
			? this.replyLocalizedEphemeral(interaction, LanguageKeys.Commands.ManageTag.RemoveAllNoEntries)
			: this.replyLocalizedEphemeral(interaction, LanguageKeys.Commands.ManageTag.RemoveAllSuccess, result.count);
	}

	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.ManageTag.Edit)
			.addStringOption(makeNameOption().setAutocomplete(true))
			.addStringOption(makeNewNameOption())
			.addStringOption(makeContentOption())
			.addBooleanOption(makeEmbedOption())
			.addStringOption(makeEmbedColorOption())
	)
	public async edit(interaction: Command.ChatInputInteraction, options: EditOptions) {
		const guildId = this.getGuildId(interaction);
		const existing = await getTag(guildId, options.name.toLowerCase());
		if (isNullish(existing)) return this.replyLocalizedEphemeral(interaction, LanguageKeys.Commands.ManageTag.Unknown, inlineCode(options.name));

		const embedColorResult = this.getEmbedColor(interaction, options, existing.embedColor);
		if (embedColorResult.isErr()) return this.replyEphemeral(interaction, inlineCode(embedColorResult.unwrapErr()));

		let nextName = existing.name;
		if (!isNullishOrEmpty(options['new-name'])) {
			nextName = sanitizeTagName(options['new-name'])!;
			if (isNullishOrEmpty(nextName)) return this.replyInvalidName(interaction, options['new-name']);

			const targetExisting = await getTag(guildId, nextName);
			if (!isNullish(targetExisting)) {
				return this.replyLocalizedEphemeral(interaction, LanguageKeys.Commands.ManageTag.Exists, inlineCode(nextName));
			}
		}

		const embed = options.embed ?? existing.embed;
		const embedColor = embedColorResult.unwrap();
		if (isNullishOrEmpty(options.content)) {
			const t = getSupportedUserLanguageT(interaction);
			const row = new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId('content')
					.setLabel(t(LanguageKeys.Commands.ManageTag.ModalContent))
					.setRequired(true)
					.setStyle(TextInputStyle.Paragraph)
					.setValue(existing.content)
			);
			return interaction.showModal({
				title: t(LanguageKeys.Commands.ManageTag.Modal),
				components: [row.toJSON()],
				custom_id: `tag.edit.${embed ? 1 : 0}.${embedColor}.${existing.name}.${nextName}`
			});
		}

		const content = options.content ?? existing.content;
		const lengthLimit = embed ? 2048 : 2000;
		if ([...content].length > lengthLimit) {
			return this.replyLocalizedEphemeral(interaction, LanguageKeys.Commands.ManageTag.TooManyCharacters, lengthLimit);
		}

		await this.container.prisma.tag.update({
			where: { id: existing.id },
			data: { name: nextName, content, embed, embedColor }
		});
		return this.replyLocalizedEphemeral(interaction, LanguageKeys.Commands.ManageTag.EditSuccess, inlineCode(nextName));
	}

	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.ManageTag.Alias)
			.addStringOption(makeNameOption().setAutocomplete(true))
			.addStringOption(makeNewNameOption().setRequired(true))
	)
	public async alias(interaction: Command.ChatInputInteraction, options: AliasOptions) {
		const name = options.name.toLowerCase();
		const alias = sanitizeTagName(options['new-name']);
		if (isNullishOrEmpty(alias)) return this.replyInvalidName(interaction, options['new-name']);
		if (name === alias) return this.replyLocalizedEphemeral(interaction, LanguageKeys.Commands.ManageTag.AliasSame, inlineCode(name));

		const guildId = this.getGuildId(interaction);
		const tag = await getTag(guildId, name, true as const);
		if (isNullish(tag)) return this.replyLocalizedEphemeral(interaction, LanguageKeys.Commands.ManageTag.Unknown, inlineCode(name));

		const aliasEntry = tag.aliases.find((entry) => entry.name === alias);
		if (!isNullish(aliasEntry)) {
			const result = await Result.fromAsync(this.container.prisma.tagAlias.delete({ where: { id: aliasEntry.id } }));
			const content = result.match({
				ok: () => resolveUserKey(interaction, LanguageKeys.Commands.ManageTag.AliasRemoveSuccess, { value: inlineCode(alias) }),
				err: (error) => {
					this.container.logger.error('[TAG]', error);
					return resolveUserKey(interaction, LanguageKeys.Commands.ManageTag.AliasRemoveFailed, { value: inlineCode(alias) });
				}
			});
			return this.replyEphemeral(interaction, content);
		}

		const target = await getTag(guildId, alias);
		// No tag by name or alias of `alias`:
		if (isNullish(target)) {
			if (tag.aliases.length >= 10) {
				return this.replyLocalizedEphemeral(interaction, LanguageKeys.Commands.ManageTag.TooManyAliases, inlineCode(tag.name));
			}

			await this.container.prisma.tagAlias.create({ data: { name: alias, tagId: tag.id } });
			return this.replyLocalizedEphemeral(interaction, LanguageKeys.Commands.ManageTag.AliasSuccess, inlineCode(alias));
		}

		return this.replyLocalizedEphemeral(
			interaction,
			target.name === alias
				? LanguageKeys.Commands.ManageTag.AliasUsed // Tag by name of `alias`
				: LanguageKeys.Commands.ManageTag.AliasIncompatible, // Tag by alias of `alias`, different ID
			inlineCode(alias)
		);
	}

	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.ManageTag.Source).addStringOption(makeNameOption().setAutocomplete(true))
	)
	public async source(interaction: Command.ChatInputInteraction, options: Options) {
		const name = options.name.toLowerCase();
		const existing = await getTag(this.getGuildId(interaction), name);
		return isNullish(existing)
			? this.replyLocalizedEphemeral(interaction, LanguageKeys.Commands.ManageTag.Unknown, inlineCode(name))
			: this.replyEphemeral(interaction, codeBlock('md', cutText(escapeCodeBlock(existing.content), 1980)));
	}

	private getGuildId(interaction: Command.Interaction) {
		return BigInt(interaction.guildId!);
	}

	private async canAddMoreTags(interaction: Command.ChatInputInteraction, guildId: bigint) {
		const count = await this.container.prisma.tag.count({ where: { guildId } });
		if (count < DefaultLimits.maximumTagCount) return ok();

		const result = await fetchLimits(guildId);
		return result.match({
			ok: (value) =>
				count < value.maximumTagCount
					? ok()
					: err(resolveUserKey(interaction, LanguageKeys.Commands.ManageTag.TooManyTags, { amount: count, limit: value.maximumTagCount })),
			err: (error) => {
				const key = isAbortError(error) ? LanguageKeys.Commands.ManageTag.AbortError : LanguageKeys.Commands.ManageTag.UnknownError;
				return err(resolveUserKey(interaction, key));
			}
		});
	}

	private replyEphemeral(interaction: Command.ChatInputInteraction, content: string) {
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	private replyLocalizedEphemeral(interaction: Command.ChatInputInteraction, key: TypedT): Promise<unknown>;
	private replyLocalizedEphemeral<T = string>(interaction: Command.ChatInputInteraction, key: TypedFT<Value<T>>, value: T): Promise<unknown>;
	private replyLocalizedEphemeral<T = string>(interaction: Command.ChatInputInteraction, key: TypedT | TypedFT<Value<T>>, value?: T) {
		return this.replyEphemeral(
			interaction,
			value === undefined ? resolveUserKey(interaction, key as TypedT) : resolveUserKey(interaction, key as TypedFT<Value<T>>, { value })
		);
	}

	private replyInvalidName(interaction: Command.ChatInputInteraction, name: string) {
		return this.replyLocalizedEphemeral(interaction, LanguageKeys.Commands.ManageTag.InvalidTagName, inlineCode(name));
	}

	private getEmbedColor(interaction: Command.ChatInputInteraction, options: Pick<AddOptions, 'embed' | 'embed-color'>, previous = 0) {
		if (!options.embed) return ok(previous);

		const raw = options['embed-color'];
		return isNullishOrEmpty(raw) ? ok(previous) : parseColor(raw).mapErr((error) => resolveUserKey(interaction, error, { value: raw! }));
	}
}

interface Options {
	name: string;
}

interface AddOptions extends Options {
	content?: string;
	embed?: boolean;
	['embed-color']?: string;
}

interface EditOptions extends Options {
	['new-name']: string;
	content?: string;
	embed?: boolean;
	['embed-color']?: string;
}

interface AliasOptions extends Options {
	['new-name']: string;
}

function makeNameOption() {
	return applyLocalizedBuilder(new SlashCommandStringOption(), LanguageKeys.Commands.ManageTag.OptionsName).setMaxLength(32).setRequired(true);
}

function makeNewNameOption() {
	return applyLocalizedBuilder(new SlashCommandStringOption(), LanguageKeys.Commands.ManageTag.OptionsNewName).setMaxLength(32);
}

function makeContentOption() {
	return applyLocalizedBuilder(new SlashCommandStringOption(), LanguageKeys.Commands.ManageTag.OptionsContent).setMaxLength(MaximumContentLength);
}

function makeEmbedOption() {
	return applyLocalizedBuilder(new SlashCommandBooleanOption(), LanguageKeys.Commands.ManageTag.OptionsEmbed);
}

function makeEmbedColorOption() {
	return applyLocalizedBuilder(new SlashCommandStringOption(), LanguageKeys.Commands.ManageTag.OptionsEmbedColor).setMaxLength(32);
}
