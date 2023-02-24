import { ReminderScheduler } from '#lib/schedules/ReminderScheduler';
import { envParseInteger, envParseString } from '@skyra/env-utilities';
import { container } from '@skyra/http-framework';
import Redis from 'ioredis';

export function run() {
	const redis = new Redis({
		port: envParseInteger('REDIS_PORT'),
		password: envParseString('REDIS_PASSWORD'),
		host: envParseString('REDIS_HOST'),
		db: envParseInteger('REDIS_REMINDERS_DB')
	});

	container.reminders = new ReminderScheduler({
		redis,
		queue: envParseString('REDIS_REMINDERS_QUEUE'),
		interval: envParseInteger('REDIS_REMINDERS_INTERVAL')
	});
}

declare module '@sapphire/pieces' {
	interface Container {
		reminders: ReminderScheduler;
	}
}
