import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { BigDecimal } from '#lib/utilities/conversion/BigDecimal';
import { toSuperscript } from '#lib/utilities/conversion/superscript';
import { Units, searchUnits, type Unit } from '#lib/utilities/conversion/units';
import { isNullish } from '@sapphire/utilities';
import { Command, RegisterCommand, type AutocompleteInteractionArguments } from '@skyra/http-framework';
import { applyLocalizedBuilder, getSupportedUserLanguageT, resolveUserKey, type TFunction } from '@skyra/http-framework-i18n';
import { MessageFlags } from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.Convert;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription) //
		.addNumberOption((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.Convert.Amount).setRequired(true))
		.addStringOption((builder) => applyLocalizedBuilder(builder, Root.From).setAutocomplete(true).setRequired(true).setMaxLength(100))
		.addStringOption((builder) => applyLocalizedBuilder(builder, Root.To).setAutocomplete(true).setRequired(true).setMaxLength(100))
)
export class UserCommand extends Command {
	public override chatInputRun(interaction: Command.ChatInputInteraction, options: Options) {
		const from = Units.get(this.sanitizeUnit(options.from));
		if (isNullish(from)) {
			const content = resolveUserKey(interaction, Root.UnitNotSupported, {
				unit: options.from
			});
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const to = Units.get(this.sanitizeUnit(options.to));
		if (isNullish(to)) {
			const content = resolveUserKey(interaction, Root.UnitNotSupported, {
				unit: options.to
			});
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		if (!from.types.some((type) => to.types.includes(type))) {
			const content = resolveUserKey(interaction, Root.MismatchingTypes, {
				fromUnit: from.symbol,
				toUnit: to.symbol
			});
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const fromValue = options.amount;
		const si = from.formulas.to(BigDecimal(fromValue));
		const toValue = Number(to.formulas.from(si));

		const t = getSupportedUserLanguageT(interaction);
		const content = resolveUserKey(interaction, Root.Result, {
			fromValue,
			fromUnitSymbol: from.symbol,
			fromUnitName: this.renderUnit(t, from),
			toValue,
			toUnitSymbol: to.symbol,
			toUnitName: this.renderUnit(t, to)
		});
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	public override autocompleteRun(
		interaction: Command.AutocompleteInteraction,
		options: AutocompleteInteractionArguments<Omit<Options, 'amount'>>
	) {
		const focusedOption = options[options.focused!];
		return interaction.reply({
			choices: searchUnits(focusedOption, interaction.locale).map((unit) => ({
				name: `${unit.value.symbol} (${this.renderUnit(getSupportedUserLanguageT(interaction), unit.value)})`,
				value: unit.value.symbol
			}))
		});
	}

	private sanitizeUnit(unit: string) {
		return unit.replaceAll(/(º)|\^(\d+)/g, (_, degree, number) => (degree ? '°' : toSuperscript(number)));
	}

	private renderUnit(t: TFunction, unit: Unit) {
		let name = t(unit.name);
		if (unit.prefixMultiplier)
			name = t(LanguageKeys.Units.PrefixUnit, {
				prefix: t(unit.prefixMultiplier),
				unit: name
			});
		if (unit.prefixDimension)
			name = t(LanguageKeys.Units.PrefixDimension, {
				dimension: t(unit.prefixDimension),
				unit: name
			});
		return name;
	}
}

interface Options {
	amount: number;
	from: string;
	to: string;
}
