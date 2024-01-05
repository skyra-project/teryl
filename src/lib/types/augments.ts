import type { IntegerString } from '@skyra/env-utilities';

declare module '@skyra/env-utilities' {
	interface Env {
		CLIENT_NAME: string;
		CLIENT_VERSION: string;

		HTTP_ADDRESS: string;
		HTTP_PORT: IntegerString;

		REGISTRY_GUILD_ID: string;

		REDIS_PORT: IntegerString;
		REDIS_PASSWORD: string;
		REDIS_HOST: string;
		REDIS_DB: IntegerString;

		REDIS_REMINDERS_DB: IntegerString;
		REDIS_REMINDERS_QUEUE: string;
		REDIS_REMINDERS_INTERVAL: IntegerString;

		INTERNAL_RING_URL: string;
		INTERNAL_RING_TOKEN: string;

		CRYPTOCOMPARE_TOKEN: string;

		GOOGLE_API_TOKEN: string;
	}
}
