import { getUnicodeInformationEmbeds } from '#lib/unicode';
import { displaySelectMenuIndex, makeActionRow } from '#lib/utilities/discord-utilities';
import { InteractionHandler, type Interactions } from '@skyra/http-framework';
import { getSupportedLanguageT } from '@skyra/http-framework-i18n';
import type { APIActionRowComponent, APIStringSelectComponent } from 'discord-api-types/v10';

export class UserHandler extends InteractionHandler {
	public async run(interaction: Interactions.MessageComponentStringSelect) {
		const parameters = interaction.values[0].split('.') as Parameters;
		const pageIndex = Number(parameters[0]);
		const characters = [...Buffer.from(parameters[1], 'base64').toString('utf8')];

		const { content } = interaction.message;
		const row = interaction.message.components![0] as APIActionRowComponent<APIStringSelectComponent>;

		const t = getSupportedLanguageT(interaction);
		const component = displaySelectMenuIndex(row.components[0], pageIndex);
		const embeds = getUnicodeInformationEmbeds(t, characters);
		return interaction.update({ content, embeds, components: [makeActionRow([component])] });
	}
}

type Parameters = [pageIndex: `${number}`, characters: string];
