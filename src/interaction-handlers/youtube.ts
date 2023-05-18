import { getLinkFromSelectMenu } from '#lib/utilities/youtube';
import { InteractionHandler, type Interactions } from '@skyra/http-framework';
import type { Snowflake } from 'discord-api-types/globals';
import { MessageFlags, type APIActionRowComponent, type APIStringSelectComponent } from 'discord-api-types/v10';

export class UserHandler extends InteractionHandler {
	public async run(interaction: Interaction, [id]: [Snowflake]) {
		const [value] = interaction.values;
		const content = getLinkFromSelectMenu(value);
		const row = interaction.message.components![0] as APIActionRowComponent<APIStringSelectComponent>;
		const component = row.components[0];
		const options = component.options.map((option) => ({ ...option, default: option.value === value }));
		if (interaction.user.id === id) {
			return interaction.update({ content, components: [{ ...row, components: [{ ...component, options }] }] });
		}

		return interaction.reply({
			content,
			components: [{ ...row, components: [{ ...component, custom_id: `youtube.${interaction.user.id}`, options }] }],
			flags: MessageFlags.Ephemeral
		});
	}
}

type Interaction = Interactions.MessageComponentStringSelect;
