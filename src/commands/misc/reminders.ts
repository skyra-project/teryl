import { escapeCodeBlock, escapeInlineCode } from '#lib/common/escape';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { codeBlock, inlineCode, SlashCommandStringOption, time, TimestampStyles } from '@discordjs/builders';
import type { Reminder } from '@prisma/client';
import { Duration } from '@sapphire/duration';
import { err, ok } from '@sapphire/result';
import { isNullish, isNullishOrEmpty } from '@sapphire/utilities';
import { Command, RegisterCommand, RegisterSubCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, resolveUserKey } from '@skyra/http-framework-i18n';
import { MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.Reminders.RootName, LanguageKeys.Commands.Reminders.RootDescription)
)
export class UserCommand extends Command {
	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Reminders.Create)
			.addStringOption(UserCommand.createContentOption().setRequired(true))
			.addStringOption(UserCommand.createTimeOption().setRequired(true))
	)
	public async create(interaction: Command.ChatInputInteraction, options: CreateOptions) {
		const dateResult = this.parseDate(interaction, options.duration);
		if (dateResult.isErr()) return interaction.reply({ content: dateResult.unwrapErr(), flags: MessageFlags.Ephemeral });

		const date = dateResult.unwrap();
		const id = await this.container.reminders.add({
			userId: BigInt(interaction.user.id),
			content: options.content.replaceAll('\\n', '\n'),
			time: date,
			targetChannelId: null
		});

		const content = resolveUserKey(interaction, LanguageKeys.Commands.Reminders.CreateContent, {
			id: inlineCode(id),
			time: time(date, TimestampStyles.LongDateTime)
		});
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Reminders.Update)
			.addStringOption(UserCommand.createIdOption().setRequired(true))
			.addStringOption(UserCommand.createContentOption())
			.addStringOption(UserCommand.createTimeOption())
	)
	public async update(interaction: Command.ChatInputInteraction, options: UpdateOptions) {
		if (isNullishOrEmpty(options.duration) && isNullishOrEmpty(options.content)) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.Reminders.UpdateMissingOptions);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const reminder = await this.container.prisma.reminder.findFirst({ where: { id: options.id, userId: BigInt(interaction.user.id) } });
		if (isNullish(reminder)) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.Reminders.InvalidId, {
				value: inlineCode(escapeInlineCode(options.id))
			});
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		let date = reminder.time;
		if (!isNullishOrEmpty(options.duration)) {
			const dateResult = this.parseDate(interaction, options.duration);
			if (dateResult.isErr()) return interaction.reply({ content: dateResult.unwrapErr(), flags: MessageFlags.Ephemeral });

			date = dateResult.unwrap();
		}

		await this.container.reminders.reschedule(reminder.id, date.getTime(), { content: options.content });
		const content = resolveUserKey(interaction, LanguageKeys.Commands.Reminders.UpdateContent, {
			id: inlineCode(reminder.id),
			time: time(date, TimestampStyles.LongDateTime)
		});
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Reminders.Delete).addStringOption(UserCommand.createIdOption().setRequired(true))
	)
	public async delete(interaction: Command.ChatInputInteraction, options: DeleteOptions) {
		const reminder = await this.container.prisma.reminder.findFirst({ where: { id: options.id, userId: BigInt(interaction.user.id) } });
		if (isNullish(reminder)) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.Reminders.InvalidId, {
				value: inlineCode(escapeInlineCode(options.id))
			});
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		await this.container.reminders.remove(reminder.id);
		const content = resolveUserKey(interaction, LanguageKeys.Commands.Reminders.DeleteContent, {
			id: inlineCode(reminder.id),
			time: time(reminder.time, TimestampStyles.LongDateTime),
			content: codeBlock(escapeCodeBlock(reminder.content))
		});
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	@RegisterSubCommand((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.Reminders.List))
	public async list(interaction: Command.ChatInputInteraction) {
		const reminders = await this.container.prisma.reminder.findMany({ where: { userId: BigInt(interaction.user.id) }, take: 10 });
		if (isNullishOrEmpty(reminders)) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.Reminders.ListEmpty, { commandId: interaction.data.id });
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const content = reminders.map((reminder) => this.formatReminder(reminder)).join('\n');
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	private parseDate(interaction: Command.ChatInputInteraction, input: string) {
		const duration = new Duration(input);
		return Number.isInteger(duration.offset)
			? ok(new Date(Date.now() + duration.offset))
			: err(resolveUserKey(interaction, LanguageKeys.Commands.Reminders.InvalidDuration, { value: inlineCode(escapeInlineCode(input)) }));
	}

	private formatReminder(reminder: Reminder) {
		return `• ${inlineCode(reminder.id)}: ${time(reminder.time, TimestampStyles.LongDateTime)} - ${inlineCode(
			escapeInlineCode(this.formatReminderContent(reminder.content))
		)}`;
	}

	private formatReminderContent(content: string) {
		const newline = content.lastIndexOf('\n', 63);
		if (newline !== -1) return content.slice(0, newline);
		if (content.length <= 64) return content;

		const space = content.lastIndexOf(' ', 63);
		return `${content.slice(0, space === -1 ? 63 : space)}…`;
	}

	private static createIdOption() {
		return applyLocalizedBuilder(new SlashCommandStringOption(), LanguageKeys.Commands.Reminders.OptionsId).setMinLength(21).setMaxLength(21);
	}

	private static createContentOption() {
		return applyLocalizedBuilder(new SlashCommandStringOption(), LanguageKeys.Commands.Reminders.OptionsContent).setMaxLength(256);
	}

	private static createTimeOption() {
		return applyLocalizedBuilder(new SlashCommandStringOption(), LanguageKeys.Commands.Reminders.OptionsDuration)
			.setMinLength(2)
			.setMaxLength(256);
	}
}

interface CreateOptions {
	content: string;
	duration: string;
}

interface UpdateOptions {
	id: string;
	content?: string;
	duration?: string;
}

interface DeleteOptions {
	id: string;
}
