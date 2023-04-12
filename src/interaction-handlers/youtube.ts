import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { getLinkFromSelectMenu } from '#lib/utilities/youtube';
import { InteractionHandler, type Interactions } from '@skyra/http-framework';
import { resolveUserKey } from '@skyra/http-framework-i18n';
import type { Snowflake } from 'discord-api-types/globals';
import { MessageFlags, type APIActionRowComponent, type APIStringSelectComponent } from 'discord-api-types/v10';

export class UserHandler extends InteractionHandler {
	public async run(interaction: Interaction, [id]: [Snowflake]) {
		if (interaction.user.id !== id) {
			const content = resolveUserKey(interaction, LanguageKeys.InteractionHandlers.YouTube.MismatchingUserId);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const [value] = interaction.values;
		const content = getLinkFromSelectMenu(value);
		const row = interaction.message.components![0] as APIActionRowComponent<APIStringSelectComponent>;
		const component = row.components[0];
		const options = component.options.map((option) => ({ ...option, default: option.value === value }));
		return interaction.update({ content, components: [{ ...row, components: [{ ...component, options }] }] });
	}
}

type Interaction = Interactions.MessageComponentStringSelect;
