import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import type { ReminderScheduler } from '#lib/schedules/ReminderScheduler';
import { ScheduleHandler } from '#lib/structures/ScheduleHandler';
import { blockQuote, time, userMention } from '@discordjs/builders';
import { Collection } from '@discordjs/collection';
import { Time } from '@sapphire/duration';
import { Result } from '@sapphire/result';
import { getT } from '@skyra/http-framework-i18n';
import {
	Locale,
	Routes,
	type RESTPostAPIChannelMessageJSONBody,
	type RESTPostAPICurrentUserCreateDMChannelJSONBody,
	type RESTPostAPICurrentUserCreateDMChannelResult
} from 'discord-api-types/v10';

export class UserScheduleHandler extends ScheduleHandler<ReminderScheduler.Data> {
	private readonly dmCache = new Collection<bigint, string>();
	private readonly dmCachePromises = new Collection<bigint, Promise<string>>();

	public async run(data: ReminderScheduler.Full) {
		await Result.fromAsync(data.metadata ? this.sendPublic(data) : this.sendPrivate(data));
		return this.finish();
	}

	private async sendPublic(data: ReminderScheduler.Full) {
		const metadata = data.metadata!;
		const channelId = metadata.channelId.toString();
		const route = Routes.channelMessages(channelId);
		const t = getT(data.language as Locale);

		const users = [data.userId.toString(), ...data.subscriptions.map((subscription) => subscription.userId.toString())].slice(0, 24);
		const content = t(LanguageKeys.ScheduleHandlers.Reminders.Public, {
			time: time(data.createdAt),
			users: users.map((user) => userMention(user))
		});
		const body = {
			content: `${content}\n${blockQuote(data.content)}`,
			allowed_mentions: { users, roles: [] }
		} satisfies RESTPostAPIChannelMessageJSONBody;
		return Promise.all([
			this.container.rest.post(route, { body }),
			this.container.rest.delete(Routes.channelMessage(channelId, metadata.messageId.toString()))
		]);
	}

	private async sendPrivate(data: ReminderScheduler.Full) {
		const route = Routes.channelMessages(await this.getDM(data.userId));
		const t = getT(data.language as Locale);

		const content = t(LanguageKeys.ScheduleHandlers.Reminders.Private, { content: data.content, time: time(data.createdAt) });
		const body = {
			content: `${content}\n${blockQuote(data.content)}`
		} satisfies RESTPostAPIChannelMessageJSONBody;
		return this.container.rest.post(route, { body });
	}

	private async getDM(userId: bigint) {
		const existing = this.dmCache.get(userId);
		if (existing) return existing;

		const existingPromise = this.dmCachePromises.get(userId);
		if (existingPromise) return existingPromise;

		const body = { recipient_id: userId.toString() } satisfies RESTPostAPICurrentUserCreateDMChannelJSONBody;
		const promise = (this.container.rest.post(Routes.userChannels(), { body }) as Promise<RESTPostAPICurrentUserCreateDMChannelResult>) //
			.then((channel) => channel.id)
			.finally(() => this.dmCachePromises.delete(userId));
		this.dmCachePromises.set(userId, promise);

		const id = await promise;
		this.dmCache.set(userId, id);
		setTimeout(() => this.dmCache.delete(userId), Time.Hour);
		return id;
	}
}
