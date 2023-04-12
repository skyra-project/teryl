import { BrandingColors } from '#lib/common/constants';
import { escapeCodeBlock, escapeInlineCode } from '#lib/common/escape';
import { cut } from '#lib/common/strings';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import type { ReminderScheduler } from '#lib/schedules/ReminderScheduler';
import { makeButtonRow } from '#lib/utilities/components';
import { DateParser } from '#lib/utilities/DateParser';
import {
	ButtonBuilder,
	codeBlock,
	EmbedBuilder,
	inlineCode,
	messageLink,
	SlashCommandBooleanOption,
	SlashCommandStringOption,
	time,
	TimestampStyles
} from '@discordjs/builders';
import type { Reminder, ReminderMetadata } from '@prisma/client';
import { Duration as SapphireDuration } from '@sapphire/duration';
import { err, ok, Result } from '@sapphire/result';
import { isNullish, isNullishOrEmpty, type Nullish } from '@sapphire/utilities';
import { Command, RegisterCommand, RegisterSubCommand, type AutocompleteInteractionArguments } from '@skyra/http-framework';
import {
	applyLocalizedBuilder,
	getSupportedLanguageName,
	getSupportedLanguageT,
	getSupportedUserLanguageName,
	resolveKey,
	resolveUserKey
} from '@skyra/http-framework-i18n';
import { ButtonStyle, MessageFlags, Routes, type RESTPatchAPIChannelMessageJSONBody } from 'discord-api-types/v10';
import { DateTime, Duration } from 'luxon';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.Reminders.RootName, LanguageKeys.Commands.Reminders.RootDescription)
)
export class UserCommand extends Command {
	public override async autocompleteRun(interaction: Command.AutocompleteInteraction, options: AutoCompleteOptions) {
		const userId = BigInt(interaction.user.id);
		const reminders = await this.container.prisma.reminder.findMany({
			where: {
				AND: [
					options.subCommand === 'show' ? { OR: [{ userId }, { subscriptions: { some: { userId } } }] } : { userId },
					{ OR: options.id ? [{ id: options.id }, { content: { contains: options.id } }] : undefined }
				]
			},
			orderBy: { time: 'asc' },
			select: { id: true, content: true, time: true },
			take: 25
		});
		if (reminders.length === 0) return interaction.replyEmpty();

		const user = await this.container.prisma.user.findFirst({ where: { id: userId }, select: { tz: true } });
		const timeZone = user?.tz?.replaceAll(' ', '_') ?? 'Etc/UTC';
		const dtf = new Intl.DateTimeFormat(getSupportedUserLanguageName(interaction), { dateStyle: 'short', timeStyle: 'short', timeZone });
		return interaction.reply({
			choices: reminders.map((reminder) => ({
				name: cut(`${dtf.format(reminder.time)} — ${reminder.content}`, 100),
				value: reminder.id
			}))
		});
	}

	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Reminders.Create)
			.addStringOption(createContentOption().setRequired(true))
			.addStringOption(createTimeOption().setRequired(true))
			.addBooleanOption(createPublicOption())
	)
	public async create(interaction: Command.ChatInputInteraction, options: CreateOptions) {
		const dateResult = await this.parseDateTime(interaction, options.duration);
		if (dateResult.isErr()) return interaction.reply({ content: dateResult.unwrapErr(), flags: MessageFlags.Ephemeral });

		const date = dateResult.unwrap();
		const data = {
			userId: BigInt(interaction.user.id),
			content: options.content.replaceAll('\\n', '\n'),
			time: date,
			createdAt: new Date(),
			language: options.public ? getSupportedLanguageName(interaction) : getSupportedUserLanguageName(interaction)
		} satisfies ReminderScheduler.Data;
		const id = await this.container.reminders.add(data);

		const parameters = { id: inlineCode(id), time: time(date, TimestampStyles.LongDateTime) };
		if (!options.public) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.Reminders.CreateContent, parameters);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const t = getSupportedLanguageT(interaction);
		const content = t(LanguageKeys.Commands.Reminders.CreateContentPublic, parameters);
		const embed = new EmbedBuilder()
			.setColor(BrandingColors.Primary)
			.setDescription(data.content)
			.setFooter({ text: id })
			.setTimestamp(data.time);
		const response = await interaction.reply({ content, embeds: [embed.toJSON()] });
		const message = (await response.get()).unwrap();
		await this.container.prisma.reminderMetadata.create({
			data: { reminderId: id, channelId: BigInt(message.channelId), messageId: BigInt(message.id) },
			select: null
		});

		const components = makeButtonRow(
			new ButtonBuilder() //
				.setCustomId(`reminders.${id}`)
				.setStyle(ButtonStyle.Primary)
				.setLabel(t(LanguageKeys.Commands.Reminders.Subscribe, { amount: 0 }))
		);
		return response.update({ components: [components.toJSON()] });
	}

	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Reminders.Update)
			.addStringOption(createIdOption().setRequired(true))
			.addStringOption(createContentOption())
			.addStringOption(createTimeOption())
	)
	public async update(interaction: Command.ChatInputInteraction, options: UpdateOptions) {
		if (isNullishOrEmpty(options.duration) && isNullishOrEmpty(options.content)) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.Reminders.UpdateMissingOptions);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const reminder = await this.container.prisma.reminder.findFirst({
			where: { id: options.id, userId: BigInt(interaction.user.id) },
			include: { metadata: true }
		});
		if (isNullish(reminder)) return this.invalidId(interaction, options.id);

		let date = reminder.time;
		if (!isNullishOrEmpty(options.duration)) {
			const dateResult = await this.parseDateTime(interaction, options.duration);
			if (dateResult.isErr()) return interaction.reply({ content: dateResult.unwrapErr(), flags: MessageFlags.Ephemeral });

			date = dateResult.unwrap();
		}

		const parameters = { id: inlineCode(reminder.id), time: time(date, TimestampStyles.LongDateTime) };
		const rescheduled = await this.container.reminders.reschedule(reminder.id, date.getTime(), {
			content: options.content?.replaceAll('\\n', '\n')
		});
		const content = resolveUserKey(interaction, LanguageKeys.Commands.Reminders.UpdateContent, parameters);
		const response = await interaction.reply({ content, flags: MessageFlags.Ephemeral });

		if (rescheduled && reminder.metadata) {
			const body = {
				content: resolveKey(interaction, LanguageKeys.Commands.Reminders.CreateContentPublic, parameters)
			} satisfies RESTPatchAPIChannelMessageJSONBody;

			const route = Routes.channelMessage(reminder.metadata.channelId.toString(), reminder.metadata.messageId.toString());
			await Result.fromAsync(this.container.rest.patch(route, { body }));
		}

		return response;
	}

	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Reminders.Delete).addStringOption(createIdOption().setRequired(true))
	)
	public async delete(interaction: Command.ChatInputInteraction, options: IdOptions) {
		const reminder = await this.container.prisma.reminder.findFirst({
			where: { id: options.id, userId: BigInt(interaction.user.id) },
			include: { metadata: true }
		});
		if (isNullish(reminder)) return this.invalidId(interaction, options.id);

		await this.container.reminders.remove(reminder.id);
		const content = resolveUserKey(interaction, LanguageKeys.Commands.Reminders.DeleteContent, {
			id: inlineCode(reminder.id),
			time: time(reminder.time, TimestampStyles.LongDateTime),
			content: codeBlock(escapeCodeBlock(reminder.content))
		});
		const response = await interaction.reply({ content, flags: MessageFlags.Ephemeral });

		if (reminder.metadata) {
			const route = Routes.channelMessage(reminder.metadata.channelId.toString(), reminder.metadata.messageId.toString());
			await Result.fromAsync(this.container.rest.delete(route));
		}

		return response;
	}

	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Reminders.Show).addStringOption(createIdOption().setRequired(true))
	)
	public async show(interaction: Command.ChatInputInteraction, options: IdOptions) {
		const userId = BigInt(interaction.user.id);
		const reminder = await this.container.prisma.reminder.findFirst({
			where: { id: options.id, OR: [{ userId }, { subscriptions: { some: { userId } } }] },
			include: { metadata: true }
		});
		if (isNullish(reminder)) return this.invalidId(interaction, options.id);

		const embed = new EmbedBuilder()
			.setColor(BrandingColors.Primary)
			.setDescription(reminder.content)
			.setFooter({ text: reminder.id })
			.setTimestamp(reminder.time);
		const components = this.getShowComponents(interaction, reminder.metadata);
		return interaction.reply({ embeds: [embed.toJSON()], components, flags: MessageFlags.Ephemeral });
	}

	@RegisterSubCommand((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.Reminders.List))
	public async list(interaction: Command.ChatInputInteraction) {
		const userId = BigInt(interaction.user.id);
		const reminders = await this.container.prisma.reminder.findMany({
			where: { OR: [{ userId }, { subscriptions: { some: { userId } } }] },
			orderBy: { time: 'asc' },
			take: 10
		});
		if (isNullishOrEmpty(reminders)) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.Reminders.ListEmpty, { commandId: interaction.data.id });
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const content = reminders.map((reminder) => this.formatReminder(reminder)).join('\n');
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	private invalidId(interaction: Command.ChatInputInteraction, id: string) {
		const content = resolveUserKey(interaction, LanguageKeys.Commands.Reminders.InvalidId, { id: inlineCode(escapeInlineCode(id)) });
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	private parseDuration(interaction: Command.ChatInputInteraction, input: string) {
		const now = Date.now();
		const duration = new SapphireDuration(input);
		if (!Number.isInteger(duration.offset)) {
			return err(resolveUserKey(interaction, LanguageKeys.Commands.Reminders.InvalidDuration, { value: inlineCode(escapeInlineCode(input)) }));
		}

		return this.checkRanges(
			interaction,
			now,
			Duration.fromObject({
				years: duration.years,
				months: duration.months,
				weeks: duration.weeks,
				days: duration.days,
				hours: duration.hours,
				minutes: duration.minutes,
				seconds: duration.seconds,
				milliseconds: duration.milliseconds
			})
		);
	}

	private async parseDateTime(interaction: Command.ChatInputInteraction, input: string) {
		const now = Date.now();
		const parser = new DateParser(input, getSupportedUserLanguageName(interaction));
		if (!parser.valid) return this.parseDuration(interaction, input);

		const settings = await this.container.prisma.user.findFirst({ where: { id: BigInt(interaction.user.id) }, select: { tz: true } });
		return this.checkRanges(interaction, now, parser.normalize(settings?.tz?.replaceAll(' ', '_')));
	}

	private checkRanges(interaction: Command.ChatInputInteraction, now: number, offset: Duration) {
		if (offset.as('minutes') < 1) return err(resolveUserKey(interaction, LanguageKeys.Commands.Reminders.DurationTooShort));
		if (offset.as('years') > 1) return err(resolveUserKey(interaction, LanguageKeys.Commands.Reminders.DurationTooLong));
		return ok(DateTime.fromMillis(now).plus(offset).toJSDate());
	}

	private formatReminder(reminder: Reminder) {
		return `• ${inlineCode(reminder.id)}: ${time(reminder.time, TimestampStyles.ShortDate)} - ${inlineCode(
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

	private getShowComponents(interaction: Command.ChatInputInteraction, metadata: ReminderMetadata | Nullish) {
		if (isNullish(metadata)) return [];

		const url = messageLink(metadata.channelId.toString(), metadata.messageId.toString());
		const label = resolveUserKey(interaction, LanguageKeys.Commands.Reminders.LinkTo);
		const row = makeButtonRow(new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(url).setLabel(label));
		return [row.toJSON()];
	}
}

function createIdOption() {
	return applyLocalizedBuilder(new SlashCommandStringOption(), LanguageKeys.Commands.Reminders.OptionsId).setAutocomplete(true);
}

function createContentOption() {
	return applyLocalizedBuilder(new SlashCommandStringOption(), LanguageKeys.Commands.Reminders.OptionsContent).setMaxLength(256);
}

function createTimeOption() {
	return applyLocalizedBuilder(new SlashCommandStringOption(), LanguageKeys.Commands.Reminders.OptionsDuration).setMinLength(2).setMaxLength(256);
}

function createPublicOption() {
	return applyLocalizedBuilder(new SlashCommandBooleanOption(), LanguageKeys.Commands.Reminders.OptionsPublic);
}

type AutoCompleteOptions = AutocompleteInteractionArguments<{ id: string }>;

interface CreateOptions {
	content: string;
	duration: string;
	public: boolean;
}

interface UpdateOptions extends IdOptions {
	content?: string;
	duration?: string;
}

interface IdOptions {
	id: string;
}
