import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { BigDecimal } from '#lib/utilities/conversion/BigDecimal';
import { toSuperscript } from '#lib/utilities/conversion/superscript';
import { Units } from '#lib/utilities/conversion/units';
import { isNullish } from '@sapphire/utilities';
import { Command, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, getSupportedUserLanguageT, resolveUserKey } from '@skyra/http-framework-i18n';
import { MessageFlags } from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.Convert;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription) //
		.addStringOption((builder) => applyLocalizedBuilder(builder, Root.From).setRequired(true))
		.addStringOption((builder) => applyLocalizedBuilder(builder, Root.To).setRequired(true))
		.addNumberOption((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.Convert.Amount))
)
export class UserCommand extends Command {
	public override chatInputRun(interaction: Command.ChatInputInteraction, options: Options) {
		const from = Units.get(this.sanitizeUnit(options.from));
		if (isNullish(from)) {
			const content = resolveUserKey(interaction, Root.UnitNotSupported, { unit: options.from });
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const to = Units.get(this.sanitizeUnit(options.to));
		if (isNullish(to)) {
			const content = resolveUserKey(interaction, Root.UnitNotSupported, { unit: options.to });
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		if (!from.types.some((type) => to.types.includes(type))) {
			const content = resolveUserKey(interaction, Root.MismatchingTypes, { fromUnit: from.symbol, toUnit: to.symbol });
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const fromValue = options.amount ?? 1;
		const si = from.formulas.to(BigDecimal(fromValue));
		const toValue = Number(to.formulas.from(si));

		const t = getSupportedUserLanguageT(interaction);
		const content = resolveUserKey(interaction, Root.Result, {
			fromValue,
			fromUnitSymbol: from.symbol,
			fromUnitName: t(from.name),
			toValue,
			toUnitSymbol: to.symbol,
			toUnitName: t(to.name)
		});
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	private sanitizeUnit(unit: string) {
		return unit.replaceAll(/(º)|\^(\d+)/g, (_, degree, number) => (degree ? '°' : toSuperscript(number)));
	}
}

interface Options {
	amount: number;
	from: string;
	to: string;
}
