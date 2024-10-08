import { escapeCodeBlock } from '#lib/common/escape';
import { clamp256 } from '#lib/common/numbers';
import { cut } from '#lib/common/strings';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { DefaultLimits, fetchLimits } from '#lib/utilities/ring';
import { getTag, makeTagChoices, sanitizeTagName, searchTag } from '#lib/utilities/tags';
import { ActionRowBuilder, SlashCommandBooleanOption, SlashCommandStringOption, TextInputBuilder, codeBlock, inlineCode } from '@discordjs/builders';
import { Result, err, ok } from '@sapphire/result';
import { isNullish, isNullishOrEmpty } from '@sapphire/utilities';
import { Command, RegisterCommand, RegisterSubcommand, type AutocompleteInteractionArguments } from '@skyra/http-framework';
import { applyLocalizedBuilder, getSupportedUserLanguageT, resolveUserKey, type TypedFT, type TypedT, type Value } from '@skyra/http-framework-i18n';
import { isAbortError } from '@skyra/safe-fetch';
import { rgb } from 'culori';
import { ApplicationIntegrationType, InteractionContextType, MessageFlags, PermissionFlagsBits, TextInputStyle } from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.ManageTag;

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
	applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription)
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
)
export class UserCommand extends Command {
	public override async autocompleteRun(interaction: Command.AutocompleteInteraction, options: AutocompleteInteractionArguments<Options>) {
		const name = sanitizeTagName(options.name);
		const results = options.name.length > 0 && name === null ? [] : await searchTag(this.getGuildId(interaction), name);
		return interaction.reply({ choices: makeTagChoices(results) });
	}

	@RegisterSubcommand((builder) =>
		applyLocalizedBuilder(builder, Root.Add)
			.addStringOption(makeNameOption().setMaxLength(32))
			.addStringOption(makeContentOption())
			.addBooleanOption(makeEmbedOption())
			.addStringOption(makeEmbedColorOption())
	)
	public async add(interaction: Command.ChatInputInteraction, options: AddOptions) {
		const name = sanitizeTagName(options.name);
		if (isNullishOrEmpty(name)) return this.replyInvalidName(interaction, options.name);

		const guildId = this.getGuildId(interaction);
		const existing = await getTag(guildId, name);
		if (!isNullish(existing)) return this.replyLocalizedEphemeral(interaction, Root.Exists, inlineCode(name));

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
				new TextInputBuilder().setCustomId('content').setLabel(t(Root.ModalContent)).setRequired(true).setStyle(TextInputStyle.Paragraph)
			);
			return interaction.showModal({
				title: t(Root.Modal),
				components: [row.toJSON()],
				custom_id: `tag.add.${embed ? 1 : 0}.${embedColor}.${name}`
			});
		}

		const lengthLimit = embed ? 2048 : 2000;
		if ([...options.content].length > lengthLimit) {
			return this.replyLocalizedEphemeral(interaction, Root.TooManyCharacters, lengthLimit);
		}

		await this.container.prisma.tag.create({ data: { name, content: options.content, embed, embedColor, guildId } });
		return this.replyLocalizedEphemeral(interaction, Root.AddSuccess, inlineCode(name));
	}

	@RegisterSubcommand((builder) => applyLocalizedBuilder(builder, Root.Remove).addStringOption(makeNameOption().setAutocomplete(true)))
	public async remove(interaction: Command.ChatInputInteraction, options: Options) {
		const guildId = this.getGuildId(interaction);
		const existing = await getTag(guildId, options.name);
		if (isNullish(existing)) return this.replyLocalizedEphemeral(interaction, Root.Unknown, inlineCode(options.name));

		const result = await Result.fromAsync(this.container.prisma.tag.delete({ where: { id: existing.id } }));
		const content = result.match({
			ok: (tag) => resolveUserKey(interaction, Root.RemoveSuccess, { value: inlineCode(tag.name) }),
			err: () => Root.Unknown
		});
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	@RegisterSubcommand((builder) => applyLocalizedBuilder(builder, Root.RemoveAll))
	public async removeAll(interaction: Command.ChatInputInteraction) {
		const result = await this.container.prisma.tag.deleteMany({ where: { guildId: this.getGuildId(interaction) } });

		return result.count === 0
			? this.replyLocalizedEphemeral(interaction, Root.RemoveAllNoEntries)
			: this.replyLocalizedEphemeral(interaction, Root.RemoveAllSuccess, result.count);
	}

	@RegisterSubcommand((builder) =>
		applyLocalizedBuilder(builder, Root.Edit)
			.addStringOption(makeNameOption().setAutocomplete(true))
			.addStringOption(makeNewNameOption())
			.addStringOption(makeContentOption())
			.addBooleanOption(makeEmbedOption())
			.addStringOption(makeEmbedColorOption())
	)
	public async edit(interaction: Command.ChatInputInteraction, options: EditOptions) {
		const guildId = this.getGuildId(interaction);
		const existing = await getTag(guildId, options.name.toLowerCase());
		if (isNullish(existing)) return this.replyLocalizedEphemeral(interaction, Root.Unknown, inlineCode(options.name));

		const embedColorResult = this.getEmbedColor(interaction, options, existing.embedColor);
		if (embedColorResult.isErr()) return this.replyEphemeral(interaction, inlineCode(embedColorResult.unwrapErr()));

		let nextName = existing.name;
		if (!isNullishOrEmpty(options['new-name'])) {
			nextName = sanitizeTagName(options['new-name'])!;
			if (isNullishOrEmpty(nextName)) return this.replyInvalidName(interaction, options['new-name']);

			const targetExisting = await getTag(guildId, nextName);
			if (!isNullish(targetExisting)) {
				return this.replyLocalizedEphemeral(interaction, Root.Exists, inlineCode(nextName));
			}
		}

		const embed = options.embed ?? existing.embed;
		const embedColor = embedColorResult.unwrap();
		if (isNullishOrEmpty(options.content)) {
			const t = getSupportedUserLanguageT(interaction);
			const row = new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId('content')
					.setLabel(t(Root.ModalContent))
					.setRequired(true)
					.setStyle(TextInputStyle.Paragraph)
					.setValue(existing.content)
			);
			return interaction.showModal({
				title: t(Root.Modal),
				components: [row.toJSON()],
				custom_id: `tag.edit.${embed ? 1 : 0}.${embedColor}.${existing.name}.${nextName}`
			});
		}

		const content = options.content ?? existing.content;
		const lengthLimit = embed ? 2048 : 2000;
		if ([...content].length > lengthLimit) {
			return this.replyLocalizedEphemeral(interaction, Root.TooManyCharacters, lengthLimit);
		}

		await this.container.prisma.tag.update({
			where: { id: existing.id },
			data: { name: nextName, content, embed, embedColor }
		});
		return this.replyLocalizedEphemeral(interaction, Root.EditSuccess, inlineCode(nextName));
	}

	@RegisterSubcommand((builder) =>
		applyLocalizedBuilder(builder, Root.Alias)
			.addStringOption(makeNameOption().setAutocomplete(true))
			.addStringOption(makeNewNameOption().setRequired(true))
	)
	public async alias(interaction: Command.ChatInputInteraction, options: AliasOptions) {
		const name = options.name.toLowerCase();
		const alias = sanitizeTagName(options['new-name']);
		if (isNullishOrEmpty(alias)) return this.replyInvalidName(interaction, options['new-name']);
		if (name === alias) return this.replyLocalizedEphemeral(interaction, Root.AliasSame, inlineCode(name));

		const guildId = this.getGuildId(interaction);
		const tag = await getTag(guildId, name, true as const);
		if (isNullish(tag)) return this.replyLocalizedEphemeral(interaction, Root.Unknown, inlineCode(name));

		const aliasEntry = tag.aliases.find((entry) => entry.name === alias);
		if (!isNullish(aliasEntry)) {
			const result = await Result.fromAsync(this.container.prisma.tagAlias.delete({ where: { id: aliasEntry.id } }));
			const content = result.match({
				ok: () => resolveUserKey(interaction, Root.AliasRemoveSuccess, { value: inlineCode(alias) }),
				err: (error) => {
					this.container.logger.error('[TAG]', error);
					return resolveUserKey(interaction, Root.AliasRemoveFailed, { value: inlineCode(alias) });
				}
			});
			return this.replyEphemeral(interaction, content);
		}

		const target = await getTag(guildId, alias);
		// No tag by name or alias of `alias`:
		if (isNullish(target)) {
			if (tag.aliases.length >= 10) {
				return this.replyLocalizedEphemeral(interaction, Root.TooManyAliases, inlineCode(tag.name));
			}

			await this.container.prisma.tagAlias.create({ data: { name: alias, tagId: tag.id } });
			return this.replyLocalizedEphemeral(interaction, Root.AliasSuccess, inlineCode(alias));
		}

		return this.replyLocalizedEphemeral(
			interaction,
			target.name === alias
				? Root.AliasUsed // Tag by name of `alias`
				: Root.AliasIncompatible, // Tag by alias of `alias`, different ID
			inlineCode(alias)
		);
	}

	@RegisterSubcommand((builder) => applyLocalizedBuilder(builder, Root.Source).addStringOption(makeNameOption().setAutocomplete(true)))
	public async source(interaction: Command.ChatInputInteraction, options: Options) {
		const name = options.name.toLowerCase();
		const existing = await getTag(this.getGuildId(interaction), name);
		return isNullish(existing)
			? this.replyLocalizedEphemeral(interaction, Root.Unknown, inlineCode(name))
			: this.replyEphemeral(interaction, codeBlock('md', cut(escapeCodeBlock(existing.content), 1980)));
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
					: err(resolveUserKey(interaction, Root.TooManyTags, { amount: count, limit: value.maximumTagCount })),
			err: (error) => {
				const key = isAbortError(error) ? Root.AbortError : Root.UnknownError;
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
		return this.replyLocalizedEphemeral(interaction, Root.InvalidTagName, inlineCode(name));
	}

	private getEmbedColor(interaction: Command.ChatInputInteraction, options: Pick<AddOptions, 'embed' | 'embed-color'>, previous = 0) {
		if (!options.embed) return ok(previous);

		const raw = options['embed-color'];
		if (isNullishOrEmpty(raw)) return ok(previous);

		const parsed = rgb(raw);
		return isNullish(parsed) //
			? err(resolveUserKey(interaction, LanguageKeys.Commands.Color.InvalidColor, { value: inlineCode(raw) }))
			: ok((clamp256(parsed.r) << 16) | (clamp256(parsed.g) << 8) | clamp256(parsed.b));
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
	return applyLocalizedBuilder(new SlashCommandStringOption(), Root.OptionsName).setRequired(true);
}

function makeNewNameOption() {
	return applyLocalizedBuilder(new SlashCommandStringOption(), Root.OptionsNewName).setMaxLength(32);
}

function makeContentOption() {
	return applyLocalizedBuilder(new SlashCommandStringOption(), Root.OptionsContent).setMaxLength(MaximumContentLength);
}

function makeEmbedOption() {
	return applyLocalizedBuilder(new SlashCommandBooleanOption(), Root.OptionsEmbed);
}

function makeEmbedColorOption() {
	return applyLocalizedBuilder(new SlashCommandStringOption(), Root.OptionsEmbedColor).setMaxLength(32);
}
