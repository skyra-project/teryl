import {
	ComponentType,
	type APIActionRowComponent,
	type APIChannel,
	type APIMessageActionRowComponent,
	type APIStringSelectComponent
} from 'discord-api-types/v10';

export function isNsfwChannel(channel: Partial<APIChannel>): boolean {
	return 'nsfw' in channel ? (channel.nsfw ?? false) : false;
}

export function makeActionRow<Component extends APIMessageActionRowComponent>(
	components: Component[]
): APIActionRowComponent<APIMessageActionRowComponent> {
	return { type: ComponentType.ActionRow, components };
}

export function displaySelectMenuIndex(component: APIStringSelectComponent, index: number): APIStringSelectComponent {
	return {
		...component,
		options: component.options.map((option, optionIndex) => ({
			...option,
			default: optionIndex === index
		}))
	};
}
