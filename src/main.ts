import { Emojis } from '#lib/common/constants';
import { setup } from '#lib/setup/all';
// import { registerCommands } from '#lib/utilities/register-commands';
import { envParseInteger, envParseString } from '@skyra/env-utilities';
import { Client, container } from '@skyra/http-framework';
import { init, load } from '@skyra/http-framework-i18n';
import { createBanner } from '@skyra/start-banner';
import gradient from 'gradient-string';

setup();

await load(new URL('../src/locales', import.meta.url));
await init({
	fallbackLng: 'en-US',
	returnNull: false,
	returnEmptyString: false,
	returnObjects: true,
	interpolation: {
		defaultVariables: {
			MessageAttachmentIcon: Emojis.MessageAttachmentIcon,
			MessageLinkIcon: Emojis.MessageLinkIcon,
			MessagePinIcon: Emojis.MessagePinIcon,
			MessageIconSlashCommandsIcon: Emojis.MessageIconSlashCommandsIcon,
			IdIcon: Emojis.IdIcon,
			OwlbotIcon: Emojis.OwlbotIcon
		}
	}
});

const client = new Client().on('error', (error) => container.logger.error(error));
await client.load();

// void registerCommands();

const address = envParseString('HTTP_ADDRESS', '0.0.0.0');
const port = envParseInteger('HTTP_PORT', 3000);
await client.listen({ address, port });

console.log(
	gradient.vice.multiline(
		createBanner({
			logo: [
				String.raw`   ╱╲  ╱╲  ╱╲ `,
				String.raw`  ╱  ╲╱  ╲╱  ╲ `,
				String.raw` ╱ ╱╲╱ ╱╲╱ ╱╲ ╲ `,
				String.raw`╱ ╱ ╱ ╱╲╱ ╱╲ ╲ ╲ `,
				String.raw`╲ ╲ ╲╱ ╱╲╱ ╱ ╱ ╱ `,
				String.raw` ╲ ╲╱ ╱╲╱ ╱╲╱ ╱ `,
				String.raw`  ╲  ╱╲  ╱╲  ╱ `,
				String.raw`   ╲╱  ╲╱  ╲╱ `,
				''
			],
			name: [
				String.raw`d888888b d88888b d8888b. db    db db`,
				String.raw`'~~88~~' 88'     88  '8D '8b  d8' 88`,
				String.raw`   88    88ooooo 88oobY'  '8bd8'  88`,
				String.raw`   88    88~~~~~ 88'8b      88    88`,
				String.raw`   88    88.     88 '88.    88    88booo.`,
				String.raw`   YP    Y88888P 88   YD    YP    Y88888P`
			],
			extra: [
				'',
				`Loaded: ${container.stores.get('commands').size} commands`,
				`      : ${container.stores.get('interaction-handlers').size} interaction handlers`,
				`Listening: ${address}:${port}`
			]
		})
	)
);
