import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { BigDecimal } from '#lib/utilities/conversion/BigDecimal';
import { Units, renderUnit, sanitizeUnit, searchUnits } from '#lib/utilities/conversion/units';
import { isNullish } from '@sapphire/utilities';
import { Command, RegisterCommand, type AutocompleteInteractionArguments } from '@skyra/http-framework';
import { applyLocalizedBuilder, getSupportedUserLanguageT, resolveUserKey } from '@skyra/http-framework-i18n';
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
		const from = Units.get(sanitizeUnit(options.from));
		if (isNullish(from)) {
			const content = resolveUserKey(interaction, Root.UnitNotSupported, {
				unit: options.from
			});
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const to = Units.get(sanitizeUnit(options.to));
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
			fromUnitName: renderUnit(t, from),
			toValue,
			toUnitSymbol: to.symbol,
			toUnitName: renderUnit(t, to)
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
				name: `${unit.value.symbol} (${renderUnit(getSupportedUserLanguageT(interaction), unit.value)})`,
				value: unit.value.symbol
			}))
		});
	}
}

interface Options {
	amount: number;
	from: string;
	to: string;
}
