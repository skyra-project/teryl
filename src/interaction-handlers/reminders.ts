import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { Collection } from '@discordjs/collection';
import type { ReminderSubscription } from '@prisma/client';
import { AsyncQueue } from '@sapphire/async-queue';
import { isNullish } from '@sapphire/utilities';
import { InteractionHandler, type Interactions } from '@skyra/http-framework';
import { resolveKey, resolveUserKey } from '@skyra/http-framework-i18n';
import { APIActionRowComponent, APIButtonComponentWithCustomId, MessageFlags, Routes } from 'discord-api-types/v10';

export class UserHandler extends InteractionHandler {
	private readonly queues = new Collection<bigint, AsyncQueue>();

	public async run(interaction: Interactions.MessageComponentButton, [id]: [string]) {
		const reminder = await this.container.prisma.reminder.findFirst({
			where: { id },
			select: { id: true, userId: true, subscriptions: true }
		});
		if (isNullish(reminder)) {
			const content = resolveUserKey(interaction, LanguageKeys.InteractionHandlers.Reminders.InvalidId);
			await interaction.reply({ content, flags: MessageFlags.Ephemeral });
			return this.container.rest.delete(Routes.channelMessage(interaction.channel.id, interaction.message.id));
		}

		const { key, amount } = await this.getContentKey(interaction, reminder);
		const content = resolveUserKey(interaction, key);
		if (amount === null) return interaction.reply({ content, flags: MessageFlags.Ephemeral });

		const label = resolveKey(interaction, LanguageKeys.Commands.Reminders.Subscribe, { amount });
		const row = interaction.message.components![0] as APIActionRowComponent<APIButtonComponentWithCustomId>;
		const component = { ...row.components[0], label } satisfies APIButtonComponentWithCustomId;
		await interaction.update({ components: [{ ...row, components: [component] }] });
		return interaction.followup({ content, flags: MessageFlags.Ephemeral });
	}

	private async getContentKey(interaction: Interactions.MessageComponentButton, reminder: Reminder) {
		const userId = BigInt(interaction.user.id);
		if (userId === reminder.userId) {
			return { key: LanguageKeys.InteractionHandlers.Reminders.Owner, amount: null };
		}

		const guildId = BigInt(interaction.guildId!);
		const queue = this.queues.ensure(guildId, () => new AsyncQueue());

		try {
			await queue.wait();

			const amount = reminder.subscriptions.length;
			const subscription = reminder.subscriptions.find((subscription) => subscription.userId === userId);
			if (subscription) {
				await this.container.prisma.reminderSubscription.delete({ where: { id: subscription.id } });
				return { key: LanguageKeys.InteractionHandlers.Reminders.Unsubscribed, amount: amount - 1 };
			}

			// Reached limit
			if (amount === 24) {
				return { key: LanguageKeys.InteractionHandlers.Reminders.ReachedLimit, amount: null };
			}

			await this.container.prisma.reminderSubscription.create({ data: { reminderId: reminder.id, userId } });
			return { key: LanguageKeys.InteractionHandlers.Reminders.Subscribed, amount: amount + 1 };
		} finally {
			queue.shift();

			// Clean-up keys
			if (queue.remaining === 0) {
				this.queues.delete(guildId);
			}
		}
	}
}

interface Reminder {
	id: string;
	userId: bigint;
	subscriptions: ReminderSubscription[];
}
