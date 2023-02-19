import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import type { ReminderSubscription } from '@prisma/client';
import { isNullish } from '@sapphire/utilities';
import { InteractionHandler, type Interactions } from '@skyra/http-framework';
import { resolveUserKey } from '@skyra/http-framework-i18n';
import { MessageFlags, Routes } from 'discord-api-types/v10';

export class UserHandler extends InteractionHandler {
	public async run(interaction: Interactions.MessageComponentButton, [id]: [string]) {
		const reminder = await this.container.prisma.reminder.findFirst({
			where: { id },
			select: { id: true, userId: true, subscriptions: true }
		});
		if (isNullish(reminder)) {
			const content = resolveUserKey(interaction, LanguageKeys.InteractionHandlers.Reminders.InvalidId);
			await interaction.reply({ content, flags: MessageFlags.Ephemeral });
			return this.container.rest.delete(Routes.channelMessage(interaction.channelId, interaction.message.id));
		}

		const content = resolveUserKey(interaction, await this.getContentKey(interaction, reminder));
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	private async getContentKey(interaction: Interactions.MessageComponentButton, reminder: Reminder) {
		const userId = BigInt(interaction.user.id);
		if (userId === reminder.userId) return LanguageKeys.InteractionHandlers.Reminders.Owner;

		const subscription = reminder.subscriptions.find((subscription) => subscription.userId === userId);
		if (subscription) {
			await this.container.prisma.reminderSubscription.delete({ where: { id: subscription.id } });
			return LanguageKeys.InteractionHandlers.Reminders.Unsubscribed;
		}

		await this.container.prisma.reminderSubscription.create({ data: { reminderId: reminder.id, userId } });
		return LanguageKeys.InteractionHandlers.Reminders.Subscribed;
	}
}

interface Reminder {
	id: string;
	userId: bigint;
	subscriptions: ReminderSubscription[];
}
