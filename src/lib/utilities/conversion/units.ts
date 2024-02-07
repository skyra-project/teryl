import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { BigDecimal, type Decimal } from '#lib/utilities/conversion/BigDecimal';
import type { TypedT } from '@skyra/http-framework-i18n';

export interface Unit {
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
	readonly value: number;
}

export const Prefixes = [
	{ name: 'quetta', symbol: 'Q', value: 1e30 },
	{ name: 'ronna', symbol: 'R', value: 1e27 },
	{ name: 'yotta', symbol: 'Y', value: 1e24 },
	{ name: 'zetta', symbol: 'Z', value: 1e21 },
	{ name: 'exa', symbol: 'E', value: 1e18 },
	{ name: 'peta', symbol: 'P', value: 1e15 },
	{ name: 'tera', symbol: 'T', value: 1e12 },
	{ name: 'giga', symbol: 'G', value: 1e9 },
	{ name: 'mega', symbol: 'M', value: 1e6 },
	{ name: 'kilo', symbol: 'k', value: 1e3 },
	{ name: 'hecto', symbol: 'h', value: 1e2 },
	{ name: 'deca', symbol: 'da', value: 1e1 },
	{ name: 'deci', symbol: 'd', value: 1e-1 },
	{ name: 'centi', symbol: 'c', value: 1e-2 },
	{ name: 'milli', symbol: 'm', value: 1e-3 },
	{ name: 'micro', symbol: 'µ', value: 1e-6 },
	{ name: 'nano', symbol: 'n', value: 1e-9 },
	{ name: 'pico', symbol: 'p', value: 1e-12 },
	{ name: 'femto', symbol: 'f', value: 1e-15 },
	{ name: 'atto', symbol: 'a', value: 1e-18 },
	{ name: 'zepto', symbol: 'z', value: 1e-21 },
	{ name: 'yocto', symbol: 'y', value: 1e-24 },
	{ name: 'ronto', symbol: 'r', value: 1e-27 },
	{ name: 'quecto', symbol: 'q', value: 1e-30 }
] as const satisfies readonly Prefix[];

export const Units = [
	// Length units:
	{ name: LanguageKeys.Units.AstronomicalUnit, symbol: 'au', value: BigDecimal(149597870700), types: [UnitType.Length] },
	{ name: LanguageKeys.Units.Feet, symbol: 'ft', value: BigDecimal(0.3048), types: [UnitType.Length] },
	{ name: LanguageKeys.Units.Inch, symbol: 'in', value: BigDecimal(0.0254), types: [UnitType.Length] },
	{ name: LanguageKeys.Units.LightSecond, symbol: 'ls', value: BigDecimal(299792458), types: [UnitType.Length] },
	{ name: LanguageKeys.Units.LightYear, symbol: 'ly', value: BigDecimal(9460730472580800n), types: [UnitType.Length] },
	{ name: LanguageKeys.Units.Meter, symbol: 'm', value: BigDecimal(1), types: [UnitType.Length], prefixes: true },
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
	{ name: LanguageKeys.Units.Second, symbol: 's', value: BigDecimal(1), types: [UnitType.Time], prefixes: true },
	{ name: LanguageKeys.Units.Week, symbol: 'wk', value: BigDecimal(604800), types: [UnitType.Time] },
	{ name: LanguageKeys.Units.Year, symbol: 'yr', value: BigDecimal(31556952000), types: [UnitType.Time] },
	{ name: LanguageKeys.Units.Millennium, symbol: 'millennium', value: BigDecimal(31556952000000), types: [UnitType.Time] },

	// Temperature units:
	{ name: LanguageKeys.Units.Celsius, symbol: '°C', value: BigDecimal(1), types: [UnitType.Temperature] },
	{ name: LanguageKeys.Units.Delisle, symbol: '°De', value: BigDecimal(-2 / 3), types: [UnitType.Temperature] },
	{ name: LanguageKeys.Units.Fahrenheit, symbol: '°F', value: BigDecimal(5 / 9), types: [UnitType.Temperature] },
	{ name: LanguageKeys.Units.GasMark, symbol: 'GM', value: BigDecimal(5 / 9), types: [UnitType.Temperature] },
	{ name: LanguageKeys.Units.Kelvin, symbol: 'K', value: BigDecimal(1), types: [UnitType.Temperature], prefixes: true },
	{ name: LanguageKeys.Units.Newton, symbol: '°N', value: BigDecimal(100 / 33), types: [UnitType.Temperature] },
	{ name: LanguageKeys.Units.Rankine, symbol: '°R', value: BigDecimal(5 / 9), types: [UnitType.Temperature] },
	{ name: LanguageKeys.Units.Reaumur, symbol: '°Re', value: BigDecimal(5 / 4), types: [UnitType.Temperature] },
	{ name: LanguageKeys.Units.Romer, symbol: '°Rø', value: BigDecimal(40 / 21), types: [UnitType.Temperature] },

	// Area units (length² units are not included here):
	{ name: LanguageKeys.Units.Acre, symbol: 'ac', value: BigDecimal(4046.8564224), types: [UnitType.Area] },
	{ name: LanguageKeys.Units.Are, symbol: 'a', value: BigDecimal(100), types: [UnitType.Area], prefixes: true },
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
	{ name: LanguageKeys.Units.Liter, symbol: 'L', value: BigDecimal(1), types: [UnitType.Volume], prefixes: true },
	{ name: LanguageKeys.Units.Minim, symbol: 'minim', value: BigDecimal(0.000061611519921875), types: [UnitType.Volume] },
	{ name: LanguageKeys.Units.Peck, symbol: 'pk', value: BigDecimal(9.09218), types: [UnitType.Volume] },
	{ name: LanguageKeys.Units.Pint, symbol: 'pt', value: BigDecimal(0.473176473), types: [UnitType.Volume] },
	{ name: LanguageKeys.Units.Quart, symbol: 'qt', value: BigDecimal(0.946352946), types: [UnitType.Volume] },
	{ name: LanguageKeys.Units.Tablespoon, symbol: 'tbsp', value: BigDecimal(0.0147867646875), types: [UnitType.Volume] },
	{ name: LanguageKeys.Units.Teaspoon, symbol: 'tsp', value: BigDecimal(0.005919388020833333), types: [UnitType.Volume] }
] as const satisfies readonly Unit[];
