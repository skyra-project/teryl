import { ActionRowBuilder, type ButtonBuilder } from '@discordjs/builders';

export function makeButtonRow(...buttons: readonly ButtonBuilder[]) {
	return new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);
}
