import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { SlashCommandNumberOption, SlashCommandStringOption } from '@discordjs/builders';
import { Command, RegisterCommand, RegisterSubcommand } from '@skyra/http-framework';
import {
	applyLocalizedBuilder,
	createSelectMenuChoiceName,
	getSupportedUserLanguageT,
	resolveUserKey,
	type LocalePrefixKey,
	type TypedFT
} from '@skyra/http-framework-i18n';
import { MessageFlags } from 'discord-api-types/v10';
import JSBD, { type Decimal } from 'jsbd';

function BigDecimal(value: number | bigint) {
	// @ts-expect-error JSBD has funny exports
	return JSBD.BigDecimal(value) as Decimal;
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
		Centimeter = 'centimeter',
		Mile = 'mile',
		NauticalMile = 'nautical-mile',
		MachSecond = 'mach-second',
		Parsec = 'parsec'
	}

	export const Units = {
		[Unit.AstronomicalUnit]: BigDecimal(149597870691),
		[Unit.Feet]: BigDecimal(0.3048),
		[Unit.Inch]: BigDecimal(0.0254),
		[Unit.Kilometer]: BigDecimal(1000n),
		[Unit.LightSecond]: BigDecimal(299792458n),
		[Unit.LightYear]: BigDecimal(9460730472580800n),
		[Unit.Meter]: BigDecimal(1n),
		[Unit.Centimeter]: BigDecimal(0.01),
		[Unit.Mile]: BigDecimal(1609.344),
		[Unit.NauticalMile]: BigDecimal(1852n),
		[Unit.MachSecond]: BigDecimal(340.3),
		[Unit.Parsec]: BigDecimal(3.0856776e16)
	};

	export const Keys = {
		[Unit.AstronomicalUnit]: LanguageKeys.Commands.Convert.UnitAstronomicalUnit,
		[Unit.Feet]: LanguageKeys.Commands.Convert.UnitFeet,
		[Unit.Inch]: LanguageKeys.Commands.Convert.UnitInch,
		[Unit.Kilometer]: LanguageKeys.Commands.Convert.UnitKilometer,
		[Unit.LightSecond]: LanguageKeys.Commands.Convert.UnitLightSecond,
		[Unit.LightYear]: LanguageKeys.Commands.Convert.UnitLightYear,
		[Unit.Meter]: LanguageKeys.Commands.Convert.UnitMeter,
		[Unit.Centimeter]: LanguageKeys.Commands.Convert.UnitCentimeter,
		[Unit.Mile]: LanguageKeys.Commands.Convert.UnitMile,
		[Unit.NauticalMile]: LanguageKeys.Commands.Convert.UnitNauticalMile,
		[Unit.MachSecond]: LanguageKeys.Commands.Convert.UnitMachSecond,
		[Unit.Parsec]: LanguageKeys.Commands.Convert.UnitParsec
	};

	export function makeOption(key: LocalePrefixKey) {
		return applyLocalizedBuilder(new SlashCommandStringOption(), key)
			.setRequired(true)
			.addChoices(
				createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthAstronomicalUnit, { value: Unit.AstronomicalUnit }),
				createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthFeet, { value: Unit.Feet }),
				createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthInch, { value: Unit.Inch }),
				createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthKilometer, { value: Unit.Kilometer }),
				createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthLightSecond, { value: Unit.LightSecond }),
				createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthLightYear, { value: Unit.LightYear }),
				createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthMeter, { value: Unit.Meter }),
				createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthCentimeter, { value: Unit.Centimeter }),
				createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthMile, { value: Unit.Mile }),
				createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthNauticalMile, { value: Unit.NauticalMile }),
				createSelectMenuChoiceName(LanguageKeys.Commands.Convert.LengthMachSecond, { value: Unit.MachSecond }),
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
		[Unit.ElectronVolt]: BigDecimal(1.78266269594484e-36),
		[Unit.Grain]: BigDecimal(0.00006479891),
		[Unit.Gram]: BigDecimal(0.001),
		[Unit.Kilogram]: BigDecimal(1n),
		[Unit.Ounce]: BigDecimal(0.028349523125),
		[Unit.Ton]: BigDecimal(1016.0469088),
		[Unit.Tonne]: BigDecimal(1000n)
	};

	export const Keys = {
		[Unit.ElectronVolt]: LanguageKeys.Commands.Convert.UnitElectronVolt,
		[Unit.Grain]: LanguageKeys.Commands.Convert.UnitGrain,
		[Unit.Gram]: LanguageKeys.Commands.Convert.UnitGram,
		[Unit.Kilogram]: LanguageKeys.Commands.Convert.UnitKilogram,
		[Unit.Ounce]: LanguageKeys.Commands.Convert.UnitOunce,
		[Unit.Ton]: LanguageKeys.Commands.Convert.UnitTon,
		[Unit.Tonne]: LanguageKeys.Commands.Convert.UnitTonne
	};

	export function makeOption(key: LocalePrefixKey) {
		return applyLocalizedBuilder(new SlashCommandStringOption(), key)
			.setRequired(true)
			.addChoices(
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
		[Unit.Century]: BigDecimal(3155760000n),
		[Unit.Day]: BigDecimal(86400n),
		[Unit.Decade]: BigDecimal(315360000n),
		[Unit.Hour]: BigDecimal(3600n),
		[Unit.LunarYear]: BigDecimal(30617568n),
		[Unit.Millennium]: BigDecimal(31536000000n),
		[Unit.Minute]: BigDecimal(60n),
		[Unit.Month]: BigDecimal(2629746n),
		[Unit.Second]: BigDecimal(1n),
		[Unit.TropicalMonth]: BigDecimal(2360584.512),
		[Unit.TropicalYear]: BigDecimal(31556925.445),
		[Unit.Week]: BigDecimal(604800n)
	};

	export const Keys = {
		[Unit.Century]: LanguageKeys.Commands.Convert.UnitCentury,
		[Unit.Day]: LanguageKeys.Commands.Convert.UnitDay,
		[Unit.Decade]: LanguageKeys.Commands.Convert.UnitDecade,
		[Unit.Hour]: LanguageKeys.Commands.Convert.UnitHour,
		[Unit.LunarYear]: LanguageKeys.Commands.Convert.UnitLunarYear,
		[Unit.Millennium]: LanguageKeys.Commands.Convert.UnitMillennium,
		[Unit.Minute]: LanguageKeys.Commands.Convert.UnitMinute,
		[Unit.Month]: LanguageKeys.Commands.Convert.UnitMonth,
		[Unit.Second]: LanguageKeys.Commands.Convert.UnitSecond,
		[Unit.TropicalMonth]: LanguageKeys.Commands.Convert.UnitTropicalMonth,
		[Unit.TropicalYear]: LanguageKeys.Commands.Convert.UnitTropicalYear,
		[Unit.Week]: LanguageKeys.Commands.Convert.UnitWeek
	};

	export function makeOption(key: LocalePrefixKey) {
		return applyLocalizedBuilder(new SlashCommandStringOption(), key)
			.setRequired(true)
			.addChoices(
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

	export const Keys = {
		[Unit.Celsius]: LanguageKeys.Commands.Convert.UnitCelsius,
		[Unit.Delisle]: LanguageKeys.Commands.Convert.UnitDelisle,
		[Unit.Fahrenheit]: LanguageKeys.Commands.Convert.UnitFahrenheit,
		[Unit.Newton]: LanguageKeys.Commands.Convert.UnitNewton,
		[Unit.Rankine]: LanguageKeys.Commands.Convert.UnitRankine,
		[Unit.Reaumur]: LanguageKeys.Commands.Convert.UnitReaumur,
		[Unit.Romer]: LanguageKeys.Commands.Convert.UnitRomer,
		[Unit.Kelvin]: LanguageKeys.Commands.Convert.UnitKelvin
	};

	export function makeOption(key: LocalePrefixKey) {
		return applyLocalizedBuilder(new SlashCommandStringOption(), key)
			.setRequired(true)
			.addChoices(
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

namespace Speed {
	export interface Options {
		amount?: number;
		fromLength: Length.Unit;
		fromTime: Time.Unit;
		toLength: Length.Unit;
		toTime: Time.Unit;
	}

	export const PerTimeKeys = {
		[Time.Unit.Century]: LanguageKeys.Commands.Convert.TimeCentury,
		[Time.Unit.Day]: LanguageKeys.Commands.Convert.TimeDay,
		[Time.Unit.Decade]: LanguageKeys.Commands.Convert.TimeDecade,
		[Time.Unit.Hour]: LanguageKeys.Commands.Convert.TimeHour,
		[Time.Unit.LunarYear]: LanguageKeys.Commands.Convert.TimeLunarYear,
		[Time.Unit.Millennium]: LanguageKeys.Commands.Convert.TimeMillennium,
		[Time.Unit.Minute]: LanguageKeys.Commands.Convert.TimeMinute,
		[Time.Unit.Month]: LanguageKeys.Commands.Convert.TimeMonth,
		[Time.Unit.Second]: LanguageKeys.Commands.Convert.TimeSecond,
		[Time.Unit.TropicalMonth]: LanguageKeys.Commands.Convert.TimeTropicalMonth,
		[Time.Unit.TropicalYear]: LanguageKeys.Commands.Convert.TimeTropicalYear,
		[Time.Unit.Week]: LanguageKeys.Commands.Convert.TimeWeek
	};
}

@RegisterCommand((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.Convert.RootName, LanguageKeys.Commands.Convert.RootDescription))
export class UserCommand extends Command {
	@RegisterSubcommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Convert.Length)
			.addStringOption(Length.makeOption(LanguageKeys.Commands.Convert.From))
			.addStringOption(Length.makeOption(LanguageKeys.Commands.Convert.To))
			.addNumberOption(UserCommand.makeAmountOption())
	)
	public length(interaction: Command.ChatInputInteraction, options: Length.Options) {
		return this.shared({
			interaction,
			amount: options.amount ?? 1,
			fromRatio: Length.Units[options.from],
			fromUnit: Length.Keys[options.from],
			toRatio: Length.Units[options.to],
			toUnit: Length.Keys[options.to]
		});
	}

	@RegisterSubcommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Convert.Mass)
			.addStringOption(Mass.makeOption(LanguageKeys.Commands.Convert.From))
			.addStringOption(Mass.makeOption(LanguageKeys.Commands.Convert.To))
			.addNumberOption(UserCommand.makeAmountOption())
	)
	public mass(interaction: Command.ChatInputInteraction, options: Mass.Options) {
		return this.shared({
			interaction,
			amount: options.amount ?? 1,
			fromRatio: Mass.Units[options.from],
			fromUnit: Mass.Keys[options.from],
			toRatio: Mass.Units[options.to],
			toUnit: Mass.Keys[options.to]
		});
	}

	@RegisterSubcommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Convert.Time)
			.addStringOption(Time.makeOption(LanguageKeys.Commands.Convert.From))
			.addStringOption(Time.makeOption(LanguageKeys.Commands.Convert.To))
			.addNumberOption(UserCommand.makeAmountOption())
	)
	public time(interaction: Command.ChatInputInteraction, options: Time.Options) {
		return this.shared({
			interaction,
			amount: options.amount ?? 1,
			fromRatio: Time.Units[options.from],
			fromUnit: Time.Keys[options.from],
			toRatio: Time.Units[options.to],
			toUnit: Time.Keys[options.to]
		});
	}

	@RegisterSubcommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Convert.Temperature)
			.addStringOption(Temperature.makeOption(LanguageKeys.Commands.Convert.From))
			.addStringOption(Temperature.makeOption(LanguageKeys.Commands.Convert.To))
			.addNumberOption(UserCommand.makeAmountOption())
	)
	public temperature(interaction: Command.ChatInputInteraction, options: Temperature.Options) {
		const amount = options.amount ?? 0;

		const kelvin = Temperature.Formulas[options.from].to(amount);
		const value = Temperature.Formulas[options.to].from(kelvin);
		return this.sharedSend({
			interaction,
			amount,
			fromUnit: Temperature.Keys[options.from],
			toUnit: Temperature.Keys[options.to],
			value
		});
	}

	@RegisterSubcommand((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Convert.Speed)
			.addStringOption(Length.makeOption(LanguageKeys.Commands.Convert.FromLength))
			.addStringOption(Time.makeOption(LanguageKeys.Commands.Convert.FromTime))
			.addStringOption(Length.makeOption(LanguageKeys.Commands.Convert.ToLength))
			.addStringOption(Time.makeOption(LanguageKeys.Commands.Convert.ToTime))
			.addNumberOption(UserCommand.makeAmountOption())
	)
	public speed(interaction: Command.ChatInputInteraction, options: Speed.Options) {
		const amount = options.amount ?? 1;
		// @ts-expect-error JSBD has funny exports
		const ratio = JSBD.divide(
			// @ts-expect-error JSBD has funny exports
			JSBD.divide(Length.Units[options.fromLength], Time.Units[options.fromTime]),
			// @ts-expect-error JSBD has funny exports
			JSBD.divide(Length.Units[options.toLength], Time.Units[options.toTime])
		);
		// @ts-expect-error JSBD has funny exports
		const value = Number(JSBD.multiply(ratio, BigDecimal(amount)));

		const t = getSupportedUserLanguageT(interaction);
		const perTime = t(Speed.PerTimeKeys[options.fromTime]);
		const from = `${t(Length.Keys[options.fromLength], { value: amount })}/${perTime}`;
		const to = `${t(Length.Keys[options.toLength], { value })}/${perTime}`;

		const content = resolveUserKey(interaction, LanguageKeys.Commands.Convert.Result, { from, to });
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	private shared(data: SharedData) {
		// @ts-expect-error JSBD has funny exports
		const ratio = JSBD.divide(data.fromRatio, data.toRatio);
		// @ts-expect-error JSBD has funny exports
		const value = Number(JSBD.multiply(ratio, BigDecimal(data.amount)));
		return this.sharedSend({
			interaction: data.interaction,
			amount: data.amount,
			value,
			fromUnit: data.fromUnit,
			toUnit: data.toUnit
		});
	}

	private sharedSend(data: SharedSendData) {
		const t = getSupportedUserLanguageT(data.interaction);
		const from = t(data.fromUnit, { value: data.amount });
		const to = t(data.toUnit, { value: data.value });

		const content = resolveUserKey(data.interaction, LanguageKeys.Commands.Convert.Result, { from, to });
		return data.interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	public static makeAmountOption() {
		return applyLocalizedBuilder(new SlashCommandNumberOption(), LanguageKeys.Commands.Convert.Amount);
	}
}

interface SharedData {
	readonly interaction: Command.ChatInputInteraction;
	readonly amount: number;
	readonly fromRatio: Decimal;
	readonly fromUnit: TypedFT<{ value: number }>;
	readonly toRatio: Decimal;
	readonly toUnit: TypedFT<{ value: number }>;
}

interface SharedSendData {
	readonly interaction: Command.ChatInputInteraction;
	readonly amount: number;
	readonly value: number;
	readonly fromUnit: TypedFT<{ value: number }>;
	readonly toUnit: TypedFT<{ value: number }>;
}
