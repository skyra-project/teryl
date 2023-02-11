import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { getTag } from '#lib/utilities/tags';
import { inlineCode } from '@discordjs/builders';
import { Result } from '@sapphire/result';
import { isNullish } from '@sapphire/utilities';
import { InteractionHandler } from '@skyra/http-framework';
import { resolveUserKey } from '@skyra/http-framework-i18n';
import { MessageFlags } from 'discord-api-types/v10';

export class UserHandler extends InteractionHandler {
	public async run(interaction: Interaction, parameters: Parameters) {
		const content = interaction.data.components[0].components[0].value;
		const embed = parameters[1] === '1';
		const embedColor = Number(parameters[2]);
		const name = parameters[3];
		const guildId = BigInt(interaction.guildId!);

		if (parameters[0] === 'add') {
			const result = await Result.fromAsync(this.container.prisma.tag.create({ data: { name, content, embed, embedColor, guildId } }));
			const key = result.isOk() ? LanguageKeys.Commands.ManageTag.AddSuccess : LanguageKeys.Commands.ManageTag.Exists;
			return interaction.reply({ content: resolveUserKey(interaction, key, { value: inlineCode(name) }), flags: MessageFlags.Ephemeral });
		}

		const nextName = parameters[4];
		if (name !== nextName) {
			const targetExisting = await getTag(guildId, nextName);
			if (!isNullish(targetExisting)) {
				return interaction.reply({
					content: resolveUserKey(interaction, LanguageKeys.Commands.ManageTag.Exists, { value: inlineCode(name) })
				});
			}
		}

		const result = await Result.fromAsync(
			this.container.prisma.tag.update({
				where: { name_guildId: { name, guildId } },
				data: { name: nextName, content, embed, embedColor }
			})
		);
		const key = result.isOk() ? LanguageKeys.Commands.ManageTag.EditSuccess : LanguageKeys.Commands.ManageTag.Exists;
		return interaction.reply({ content: resolveUserKey(interaction, key, { value: inlineCode(name) }), flags: MessageFlags.Ephemeral });
	}
}

type Interaction = InteractionHandler.ModalInteraction;
type Parameters =
	| [type: 'add', embed: `${0 | 1}`, embedColor: `${number}`, name: string]
	| [type: 'edit', embed: `${0 | 1}`, embedColor: `${number}`, name: string, nextName: string];
