import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { BigDecimal, div, eq, mul, type Decimal } from '#lib/utilities/conversion/BigDecimal';
import { Formulas, TemperatureUnit } from '#lib/utilities/conversion/temperature';
import { Collection, type ReadonlyCollection } from '@discordjs/collection';
import type { TypedT } from '@skyra/http-framework-i18n';

export interface Formula {
	readonly from: (si: Decimal) => Decimal;
	readonly to: (value: Decimal) => Decimal;
}

export interface UnitOptions {
	/**
	 * The name of the unit, e.g. 'meter'.
	 */
	readonly name: TypedT;
	/**
	 * The symbol of the unit, e.g. 'm'.
	 */
	readonly symbol: string;
	/**
	 * The value of the unit, e.g. 1.
	 */
	readonly value: Decimal;
	/**
	 * The unit types this unit can be used for.
	 */
	readonly types: readonly UnitType[];
	/**
	 * Whether or not this unit supports prefixes.
	 * @default false
	 */
	readonly prefixes?: boolean;
	/**
	 * The formula to convert to and from the SI unit.
	 */
	readonly formulas?: Formula;
}

export interface Unit extends Omit<UnitOptions, 'prefixes'> {
	readonly formulas: Formula;
}

/**
 * The SI base units.
 */
export enum UnitType {
	/**
	 * A scalar unit used to represent the dimensionless quantity.
	 * The SI unit for this is the meter (m).
	 * @see {@link https://en.wikipedia.org/wiki/Length}
	 */
	Length,
	/**
	 * A scalar unit used to represent time.
	 * The SI unit for this is the second (s).
	 * @see {@link https://en.wikipedia.org/wiki/Time}
	 */
	Time,
	/**
	 * A scalar unit used to represent mass.
	 * The SI unit for this is the kilogram (kg).
	 * @see {@link https://en.wikipedia.org/wiki/Mass}
	 */
	Mass,
	/**
	 * A scalar unit used to represent electric current.
	 * The SI unit for this is the ampere (A).
	 * @see {@link https://en.wikipedia.org/wiki/Electric_current}
	 */
	ElectricCurrent,
	/**
	 * A scalar unit used to represent thermodynamic temperature.
	 * The SI unit for this is the kelvin (K).
	 * @see {@link https://en.wikipedia.org/wiki/Thermodynamic_temperature}
	 */
	Temperature,
	/**
	 * A scalar unit used to represent the amount of substance.
	 * The SI unit for this is the mole (mol).
	 * @see {@link https://en.wikipedia.org/wiki/Amount_of_substance}
	 */
	AmountOfSubstance,
	/**
	 * A scalar unit used to represent luminous intensity.
	 * The SI unit for this is the candela (cd).
	 * @see {@link https://en.wikipedia.org/wiki/Luminous_intensity}
	 */
	LuminousIntensity,
	/**
	 * A scalar unit used to represent area in 2D space.
	 * The SI unit for this is the square meter (m²).
	 * @see {@link https://en.wikipedia.org/wiki/Area}
	 */
	Area,
	/**
	 * A scalar unit used to represent volume in 3D space.
	 * The SI unit for this is the cubic meter (m³).
	 * @see {@link https://en.wikipedia.org/wiki/Volume}
	 */
	Volume
}

/**
 * The SI prefixes.
 * @see {@link https://en.wikipedia.org/wiki/Metric_prefix}
 */
export interface Prefix {
	readonly name: string;
	readonly symbol: string;
	readonly value: Decimal;
}

export const Prefixes = [
	{ name: 'quetta', symbol: 'Q', value: BigDecimal(1e30) },
	{ name: 'ronna', symbol: 'R', value: BigDecimal(1e27) },
	{ name: 'yotta', symbol: 'Y', value: BigDecimal(1e24) },
	{ name: 'zetta', symbol: 'Z', value: BigDecimal(1e21) },
	{ name: 'exa', symbol: 'E', value: BigDecimal(1e18) },
	{ name: 'peta', symbol: 'P', value: BigDecimal(1e15) },
	{ name: 'tera', symbol: 'T', value: BigDecimal(1e12) },
	{ name: 'giga', symbol: 'G', value: BigDecimal(1e9) },
	{ name: 'mega', symbol: 'M', value: BigDecimal(1e6) },
	{ name: 'kilo', symbol: 'k', value: BigDecimal(1e3) },
	{ name: 'hecto', symbol: 'h', value: BigDecimal(1e2) },
	{ name: 'deca', symbol: 'da', value: BigDecimal(1e1) },
	{ name: 'deci', symbol: 'd', value: BigDecimal(1e-1) },
	{ name: 'centi', symbol: 'c', value: BigDecimal(1e-2) },
	{ name: 'milli', symbol: 'm', value: BigDecimal(1e-3) },
	{ name: 'micro', symbol: 'µ', value: BigDecimal(1e-6) },
	{ name: 'nano', symbol: 'n', value: BigDecimal(1e-9) },
	{ name: 'pico', symbol: 'p', value: BigDecimal(1e-12) },
	{ name: 'femto', symbol: 'f', value: BigDecimal(1e-15) },
	{ name: 'atto', symbol: 'a', value: BigDecimal(1e-18) },
	{ name: 'zepto', symbol: 'z', value: BigDecimal(1e-21) },
	{ name: 'yocto', symbol: 'y', value: BigDecimal(1e-24) },
	{ name: 'ronto', symbol: 'r', value: BigDecimal(1e-27) },
	{ name: 'quecto', symbol: 'q', value: BigDecimal(1e-30) }
] as const satisfies readonly Prefix[];

const d1 = BigDecimal(1);
export const Units = makeUnits(
	// Length units:
	{ name: LanguageKeys.Units.AstronomicalUnit, symbol: 'AU', value: BigDecimal(149597870700), types: [UnitType.Length] },
	{ name: LanguageKeys.Units.Feet, symbol: 'ft', value: BigDecimal(0.3048), types: [UnitType.Length] },
	{ name: LanguageKeys.Units.Inch, symbol: 'in', value: BigDecimal(0.0254), types: [UnitType.Length] },
	{ name: LanguageKeys.Units.LightSecond, symbol: 'ls', value: BigDecimal(299792458), types: [UnitType.Length] },
	{ name: LanguageKeys.Units.LightYear, symbol: 'ly', value: BigDecimal(9460730472580800n), types: [UnitType.Length] },
	{ name: LanguageKeys.Units.Meter, symbol: 'm', value: d1, types: [UnitType.Length], prefixes: true },
	{ name: LanguageKeys.Units.Mile, symbol: 'mi', value: BigDecimal(1609.344), types: [UnitType.Length] },
	{ name: LanguageKeys.Units.NauticalMile, symbol: 'nmi', value: BigDecimal(1852), types: [UnitType.Length] },
	{ name: LanguageKeys.Units.Yard, symbol: 'yd', value: BigDecimal(0.9144), types: [UnitType.Length] },
	{ name: LanguageKeys.Units.Parsec, symbol: 'pc', value: BigDecimal(30856775814671900n), types: [UnitType.Length] },

	// Mass units:
	{ name: LanguageKeys.Units.ElectronVolt, symbol: 'eV', value: BigDecimal(1.602176634e-19), types: [UnitType.Mass, UnitType.ElectricCurrent] },
	{ name: LanguageKeys.Units.Grain, symbol: 'gr', value: BigDecimal(6.479891e-5), types: [UnitType.Mass] },
	{ name: LanguageKeys.Units.Gram, symbol: 'g', value: BigDecimal(0.001), types: [UnitType.Mass], prefixes: true },
	{ name: LanguageKeys.Units.Ounce, symbol: 'oz', value: BigDecimal(0.028349523125), types: [UnitType.Mass] },
	{ name: LanguageKeys.Units.Pound, symbol: 'lb', value: BigDecimal(0.45359237), types: [UnitType.Mass] },
	{ name: LanguageKeys.Units.Quintal, symbol: 'q', value: BigDecimal(100), types: [UnitType.Mass] },
	{ name: LanguageKeys.Units.Ton, symbol: 't', value: BigDecimal(1016.0469088), types: [UnitType.Mass] },
	{ name: LanguageKeys.Units.Tonne, symbol: 't', value: BigDecimal(1000), types: [UnitType.Mass] },

	// Time units:
	{ name: LanguageKeys.Units.Century, symbol: 'century', value: BigDecimal(3155695200000), types: [UnitType.Time] },
	{ name: LanguageKeys.Units.Day, symbol: 'd', value: BigDecimal(86400), types: [UnitType.Time] },
	{ name: LanguageKeys.Units.Hour, symbol: 'h', value: BigDecimal(3600), types: [UnitType.Time] },
	{ name: LanguageKeys.Units.Minute, symbol: 'min', value: BigDecimal(60), types: [UnitType.Time] },
	{ name: LanguageKeys.Units.Second, symbol: 's', value: d1, types: [UnitType.Time] },
	{ name: LanguageKeys.Units.Week, symbol: 'wk', value: BigDecimal(604800), types: [UnitType.Time] },
	{ name: LanguageKeys.Units.Year, symbol: 'yr', value: BigDecimal(31556952000), types: [UnitType.Time] },
	{ name: LanguageKeys.Units.Millennium, symbol: 'millennium', value: BigDecimal(31556952000000), types: [UnitType.Time] },

	// Temperature units:
	{
		name: LanguageKeys.Units.Celsius,
		symbol: TemperatureUnit.Celsius,
		value: d1,
		types: [UnitType.Temperature],
		formulas: Formulas[TemperatureUnit.Celsius]
	},
	{
		name: LanguageKeys.Units.Delisle,
		symbol: TemperatureUnit.Delisle,
		value: d1,
		types: [UnitType.Temperature],
		formulas: Formulas[TemperatureUnit.Delisle]
	},
	{
		name: LanguageKeys.Units.Fahrenheit,
		symbol: TemperatureUnit.Fahrenheit,
		value: d1,
		types: [UnitType.Temperature],
		formulas: Formulas[TemperatureUnit.Fahrenheit]
	},
	{
		name: LanguageKeys.Units.GasMark,
		symbol: TemperatureUnit.GasMark,
		value: d1,
		types: [UnitType.Temperature],
		formulas: Formulas[TemperatureUnit.GasMark]
	},
	{
		name: LanguageKeys.Units.Kelvin,
		symbol: TemperatureUnit.Kelvin,
		value: d1,
		types: [UnitType.Temperature],
		prefixes: true,
		formulas: Formulas[TemperatureUnit.Kelvin]
	},
	{
		name: LanguageKeys.Units.Newton,
		symbol: TemperatureUnit.Newton,
		value: d1,
		types: [UnitType.Temperature],
		formulas: Formulas[TemperatureUnit.Newton]
	},
	{
		name: LanguageKeys.Units.Rankine,
		symbol: TemperatureUnit.Rankine,
		value: d1,
		types: [UnitType.Temperature],
		formulas: Formulas[TemperatureUnit.Rankine]
	},
	{
		name: LanguageKeys.Units.Reaumur,
		symbol: TemperatureUnit.Reaumur,
		value: d1,
		types: [UnitType.Temperature],
		formulas: Formulas[TemperatureUnit.Reaumur]
	},
	{
		name: LanguageKeys.Units.Romer,
		symbol: TemperatureUnit.Romer,
		value: d1,
		types: [UnitType.Temperature],
		formulas: Formulas[TemperatureUnit.Romer]
	},

	// Area units (length² units are not included here):
	{ name: LanguageKeys.Units.Acre, symbol: 'ac', value: BigDecimal(4046.8564224), types: [UnitType.Area] },
	{ name: LanguageKeys.Units.Are, symbol: 'a', value: BigDecimal(100), types: [UnitType.Area] },
	{ name: LanguageKeys.Units.Barn, symbol: 'b', value: BigDecimal(1e-28), types: [UnitType.Area] },
	{ name: LanguageKeys.Units.Hectare, symbol: 'ha', value: BigDecimal(10000), types: [UnitType.Area] },

	// Volume units (length³ units are not included here):
	{ name: LanguageKeys.Units.Barrel, symbol: 'bbl', value: BigDecimal(119.240471196), types: [UnitType.Volume] },
	{ name: LanguageKeys.Units.Bushel, symbol: 'bu', value: BigDecimal(36.36872), types: [UnitType.Volume] },
	{ name: LanguageKeys.Units.Cord, symbol: 'cord', value: BigDecimal(3.624556363776), types: [UnitType.Volume] },
	{ name: LanguageKeys.Units.Dram, symbol: 'fl dr', value: BigDecimal(0.0036966911953125), types: [UnitType.Volume] },
	{ name: LanguageKeys.Units.FluidOunce, symbol: 'fl oz', value: BigDecimal(0.0295735295625), types: [UnitType.Volume] },
	{ name: LanguageKeys.Units.GallonImperial, symbol: 'imp gal', value: BigDecimal(4.54609), types: [UnitType.Volume] },
	{ name: LanguageKeys.Units.GallonUS, symbol: 'US gal', value: BigDecimal(3.785411784), types: [UnitType.Volume] },
	{ name: LanguageKeys.Units.Gill, symbol: 'gi', value: BigDecimal(0.11829411825), types: [UnitType.Volume] },
	{ name: LanguageKeys.Units.Hogshead, symbol: 'hhd', value: BigDecimal(238.480942392), types: [UnitType.Volume] },
	{ name: LanguageKeys.Units.Liter, symbol: 'L', value: d1, types: [UnitType.Volume], prefixes: true },
	{ name: LanguageKeys.Units.Minim, symbol: 'minim', value: BigDecimal(0.000061611519921875), types: [UnitType.Volume] },
	{ name: LanguageKeys.Units.Peck, symbol: 'pk', value: BigDecimal(9.09218), types: [UnitType.Volume] },
	{ name: LanguageKeys.Units.Pint, symbol: 'pt', value: BigDecimal(0.473176473), types: [UnitType.Volume] },
	{ name: LanguageKeys.Units.Quart, symbol: 'qt', value: BigDecimal(0.946352946), types: [UnitType.Volume] },
	{ name: LanguageKeys.Units.Tablespoon, symbol: 'tbsp', value: BigDecimal(0.0147867646875), types: [UnitType.Volume] },
	{ name: LanguageKeys.Units.Teaspoon, symbol: 'tsp', value: BigDecimal(0.005919388020833333), types: [UnitType.Volume] }
);

function makeUnits(...units: readonly UnitOptions[]): ReadonlyCollection<string, Unit> {
	const collection = new Collection<string, Unit>();
	for (const unit of units) {
		if (unit.prefixes) {
			for (const prefix of Prefixes) {
				const symbol = `${prefix.symbol}${unit.symbol}`;
				collection.set(
					symbol,
					makeUnit({
						...unit,
						name: `units:${prefix.name}${unit.name.slice(6)}` as TypedT,
						symbol,
						value: mul(unit.value, prefix.value)
					})
				);
			}
		}
		collection.set(unit.symbol, makeUnit(unit));
	}
	return collection;
}

function makeUnit(unit: UnitOptions): Unit {
	return {
		name: unit.name,
		symbol: unit.symbol,
		value: unit.value,
		types: unit.types,
		formulas: unit.formulas
			? eq(unit.value, d1)
				? unit.formulas
				: { from: (si) => div(unit.formulas!.from(si), unit.value), to: (value) => mul(unit.formulas!.to(value), unit.value) }
			: { from: (si) => div(si, unit.value), to: (value) => mul(value, unit.value) }
	};
}
