import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { SlashCommandNumberOption, SlashCommandStringOption } from '@discordjs/builders';
import { Command, RegisterCommand, RegisterSubCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, createSelectMenuChoiceName, LocalePrefixKey, resolveUserKey } from '@skyra/http-framework-i18n';
import { MessageFlags } from 'discord-api-types/v10';
import JSBD, { Decimal } from 'jsbd';

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

namespace Time {
	export interface Options {
		amount?: number;
		from: Unit;
		to: Unit;
	}

	export const enum Unit {
		Century = 'century',
		Day = 'day',
		Decade = 'decade',
		Hour = 'hour',
		LunarYear = 'lunar-year',
		Millennium = 'millennium',
		Minute = 'minute',
		Month = 'month',
		Second = 'second',
		TropicalMonth = 'tropical-month',
		TropicalYear = 'tropical-year',
		Week = 'week'
	}

	export const Units = {
		[Unit.Century]: new Decimal(3155760000n),
		[Unit.Day]: new Decimal(86400n),
		[Unit.Decade]: new Decimal(315360000n),
		[Unit.Hour]: new Decimal(3600n),
		[Unit.LunarYear]: new Decimal(30617568n),
		[Unit.Millennium]: new Decimal(31536000000n),
		[Unit.Minute]: new Decimal(60n),
		[Unit.Month]: new Decimal(2629746n),
		[Unit.Second]: new Decimal(1n),
		[Unit.TropicalMonth]: new Decimal(2360584.512),
		[Unit.TropicalYear]: new Decimal(31556925.445),
		[Unit.Week]: new Decimal(604800n)
	};

	export function makeOption(key: LocalePrefixKey) {
		return applyLocalizedBuilder(new SlashCommandStringOption(), key).addChoices(
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TimeCentury, { value: Unit.Century }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TimeDay, { value: Unit.Day }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TimeDecade, { value: Unit.Decade }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TimeHour, { value: Unit.Hour }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TimeLunarYear, { value: Unit.LunarYear }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TimeMillennium, { value: Unit.Millennium }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TimeMinute, { value: Unit.Minute }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TimeMonth, { value: Unit.Month }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TimeSecond, { value: Unit.Second }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TimeTropicalMonth, { value: Unit.TropicalMonth }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TimeTropicalYear, { value: Unit.TropicalYear }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TimeWeek, { value: Unit.Week })
		);
	}
}

namespace Temperature {
	export interface Options {
		amount?: number;
		from: Unit;
		to: Unit;
	}

	export const enum Unit {
		Celsius = 'celsius',
		Delisle = 'delisle',
		Fahrenheit = 'fahrenheit',
		Newton = 'newton',
		Rankine = 'rankine',
		Reaumur = 'reaumur',
		Romer = 'romer',
		Kelvin = 'kelvin'
	}

	export const Formulas = {
		[Unit.Celsius]: {
			from: (kelvin: number) => kelvin - 273.15,
			to: (value: number) => value + 273.15
		},
		[Unit.Delisle]: {
			from: (kelvin: number) => (kelvin - 273.15) * 1.5 - 100,
			to: (value: number) => (value + 100) / 1.5 + 273.15
		},
		[Unit.Fahrenheit]: {
			from: (kelvin: number) => (kelvin - 273.15) * 1.8 + 32,
			to: (value: number) => (value - 32) / 1.8 + 273.15
		},
		[Unit.Newton]: {
			from: (kelvin: number) => (kelvin - 273.15) * 0.33,
			to: (value: number) => value / 0.33 + 273.15
		},
		[Unit.Rankine]: {
			from: (kelvin: number) => (kelvin - 273.15) * 1.8 + 491.67,
			to: (value: number) => (value - 491.67) / 1.8 + 273.15
		},
		[Unit.Reaumur]: {
			from: (kelvin: number) => (kelvin - 273.15) * 0.8,
			to: (value: number) => value / 0.8 + 273.15
		},
		[Unit.Romer]: {
			from: (kelvin: number) => (kelvin - 273.15) * 0.525 + 7.5,
			to: (value: number) => (value - 7.5) / 0.525 + 273.15
		},
		[Unit.Kelvin]: {
			from: (kelvin: number) => kelvin,
			to: (value: number) => value
		}
	};

	export function makeOption(key: LocalePrefixKey) {
		return applyLocalizedBuilder(new SlashCommandStringOption(), key).addChoices(
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TemperatureCelsius, { value: Unit.Celsius }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TemperatureDelisle, { value: Unit.Delisle }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TemperatureFahrenheit, { value: Unit.Fahrenheit }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TemperatureNewton, { value: Unit.Newton }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TemperatureRankine, { value: Unit.Rankine }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TemperatureReaumur, { value: Unit.Reaumur }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TemperatureRomer, { value: Unit.Romer }),
			createSelectMenuChoiceName(LanguageKeys.Commands.Convert.TemperatureKelvin, { value: Unit.Kelvin })
		);
	}
}

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

	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Convert.Time)
			.addNumberOption(UserCommand.makeAmountOption())
			.addStringOption(Time.makeOption(LanguageKeys.Commands.Convert.From))
			.addStringOption(Time.makeOption(LanguageKeys.Commands.Convert.To))
	)
	public time(interaction: Command.Interaction, options: Time.Options) {
		return this.shared(interaction, options.amount, Time.Units[options.from], Time.Units[options.to]);
	}

	@RegisterSubCommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Convert.Temperature)
			.addNumberOption(UserCommand.makeAmountOption())
			.addStringOption(Temperature.makeOption(LanguageKeys.Commands.Convert.From))
			.addStringOption(Temperature.makeOption(LanguageKeys.Commands.Convert.To))
	)
	public temperature(interaction: Command.Interaction, options: Temperature.Options) {
		const kelvin = Temperature.Formulas[options.from].to(options.amount ?? 0);
		const value = Temperature.Formulas[options.to].from(kelvin);
		return this.sharedSend(interaction, value);
	}

	private shared(interaction: Command.Interaction, amount: number | undefined, from: Decimal, to: Decimal) {
		const ratio = JSBD.divide(to, from);
		const value = Number(JSBD.multiply(ratio, new Decimal(amount ?? 1)));
		return this.sharedSend(interaction, value);
	}

	private sharedSend(interaction: Command.Interaction, value: number) {
		const content = resolveUserKey(interaction, LanguageKeys.Commands.Convert.Result, { value });
		return this.message({ content, flags: MessageFlags.Ephemeral });
	}

	public static makeAmountOption() {
		return applyLocalizedBuilder(new SlashCommandNumberOption(), LanguageKeys.Commands.Convert.Amount) //
			.setMinValue(0)
			.setRequired(false);
	}
}
