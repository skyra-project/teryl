import type { IntegerString } from '@skyra/env-utilities';

declare module '@skyra/env-utilities' {
	interface Env {
		CLIENT_VERSION: string;

		HTTP_ADDRESS: string;
		HTTP_PORT: IntegerString;

		REGISTRY_GUILD_ID: string;

		REDIS_PORT: IntegerString;
		REDIS_PASSWORD: string;
		REDIS_HOST: string;
		REDIS_DB: IntegerString;

		TWITCH_CLIENT_ID: string;
		TWITCH_TOKEN: string;
	}
}
