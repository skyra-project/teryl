import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { SlashCommandNumberOption, SlashCommandStringOption } from '@discordjs/builders';
import { Command, RegisterCommand, RegisterSubCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, createSelectMenuChoiceName, LocalePrefixKey, resolveUserKey } from '@skyra/http-framework-i18n';
import { MessageFlags } from 'discord-api-types/v10';
import JSBD, { Decimal } from 'jsbd';

@RegisterCommand((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.Convert.RootName, LanguageKeys.Commands.Convert.RootDescription))
export class UserCommand extends Command {
	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Convert.Length)
			.addNumberOption(UserCommand.makeAmountOption())
			.addStringOption(Length.makeOption(LanguageKeys.Commands.Convert.From))
			.addStringOption(Length.makeOption(LanguageKeys.Commands.Convert.To))
	)
	public length(interaction: Command.Interaction, options: Length.Options) {
		return this.shared(interaction, options.amount, Length.Units[options.from], Length.Units[options.to]);
	}

	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Convert.Mass)
			.addNumberOption(UserCommand.makeAmountOption())
			.addStringOption(Mass.makeOption(LanguageKeys.Commands.Convert.From))
			.addStringOption(Mass.makeOption(LanguageKeys.Commands.Convert.To))
	)
	public mass(interaction: Command.Interaction, options: Mass.Options) {
		return this.shared(interaction, options.amount, Mass.Units[options.from], Mass.Units[options.to]);
	}

	public time() {
		// TODO
	}

	public electricCurrent() {
		// TODO
	}

	public temperature() {
		// TODO
	}

	private shared(interaction: Command.Interaction, amount: number | undefined, from: Decimal, to: Decimal) {
		const offset = JSBD.divide(to, from);
		const value = Number(JSBD.multiply(offset, new Decimal(amount ?? 1)));
		const content = resolveUserKey(interaction, LanguageKeys.Commands.Convert.Result, { value });
		return this.message({ content, flags: MessageFlags.Ephemeral });
	}

	public static makeAmountOption() {
		return applyLocalizedBuilder(new SlashCommandNumberOption(), LanguageKeys.Commands.Convert.Amount) //
			.setMinValue(0)
			.setRequired(false);
	}
}

namespace Length {
	export interface Options {
		amount?: number;
		from: Unit;
		to: Unit;
	}

	export const enum Unit {
		AstronomicalUnit = 'astronomical-unit',
		Feet = 'foot',
		Inch = 'inch',
		Kilometer = 'kilometer',
		LightSecond = 'light-second',
		LightYear = 'light-year',
		Meter = 'meter',
		Mile = 'mile',
		NauticalMile = 'nautical-mile',
		Parsec = 'parsec'
	}

	export const Units = {
		[Unit.AstronomicalUnit]: new Decimal(149597870691),
		[Unit.Feet]: new Decimal(0.3048),
		[Unit.Inch]: new Decimal(0.0254),
		[Unit.Kilometer]: new Decimal(1000n),
		[Unit.LightSecond]: new Decimal(299792458n),
		[Unit.LightYear]: new Decimal(9460730472580800n),
		[Unit.Meter]: new Decimal(1n),
		[Unit.Mile]: new Decimal(1609.344),
		[Unit.NauticalMile]: new Decimal(1852n),
		[Unit.Parsec]: new Decimal(3.0856776e16)
	};

	export function makeOption(key: LocalePrefixKey) {
		return applyLocalizedBuilder(new SlashCommandStringOption(), key).addChoices(
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthAstronomicalUnit, { value: Unit.AstronomicalUnit }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthFeet, { value: Unit.Feet }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthInch, { value: Unit.Inch }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthKilometer, { value: Unit.Kilometer }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthLightSecond, { value: Unit.LightSecond }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthLightYear, { value: Unit.LightYear }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthMeter, { value: Unit.Meter }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthMile, { value: Unit.Mile }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthNauticalMile, { value: Unit.NauticalMile }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthParsec, { value: Unit.Parsec })
		);
	}
}

namespace Mass {
	export interface Options {
		amount?: number;
		from: Unit;
		to: Unit;
	}

	export const enum Unit {
		ElectronVolt = 'electron-volt',
		Grain = 'grain',
		Gram = 'gram',
		Kilogram = 'kilogram',
		Ounce = 'ounce',
		Ton = 'ton',
		Tonne = 'tonne'
	}

	export const Units = {
		[Unit.ElectronVolt]: new Decimal(1.78266269594484e-36),
		[Unit.Grain]: new Decimal(0.00006479891),
		[Unit.Gram]: new Decimal(0.001),
		[Unit.Kilogram]: new Decimal(1n),
		[Unit.Ounce]: new Decimal(0.028349523125),
		[Unit.Ton]: new Decimal(1016.0469088),
		[Unit.Tonne]: new Decimal(1000n)
	};

	export function makeOption(key: LocalePrefixKey) {
		return applyLocalizedBuilder(new SlashCommandStringOption(), key).addChoices(
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.MassElectronVolt, { value: Unit.ElectronVolt }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.MassGrain, { value: Unit.Grain }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.MassGram, { value: Unit.Gram }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.MassKilogram, { value: Unit.Kilogram }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.MassOunce, { value: Unit.Ounce }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.MassTon, { value: Unit.Ton }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.MassTonne, { value: Unit.Tonne })
		);
	}
}
