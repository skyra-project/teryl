import { BigDecimal, add, div, mul, sub } from '#lib/utilities/conversion/BigDecimal';
import type { Formula } from '#lib/utilities/conversion/units';

export const enum TemperatureUnit {
	Celsius = '°C',
	Delisle = '°De',
	Fahrenheit = '°F',
	GasMark = 'GM',
	Kelvin = 'K',
	Newton = '°N',
	Rankine = '°R',
	Reaumur = '°Re',
	Romer = '°Rø'
}

const x491_67 = BigDecimal(491.67);
const x273_15 = BigDecimal(273.15);
const x100 = BigDecimal(100);
const x32 = BigDecimal(32);
const x7_5 = BigDecimal(7.5);
const x1_8 = BigDecimal(1.8);
const x1_5 = BigDecimal(1.5);
const x1 = BigDecimal(1);
const x0_8 = BigDecimal(0.8);
const x0_525 = BigDecimal(0.525);
const x0_55 = BigDecimal(0.55);
const x0_33 = BigDecimal(0.33);

export const Formulas: Record<TemperatureUnit, Formula> = {
	[TemperatureUnit.Celsius]: {
		// K − 273.15
		from: (kelvin) => sub(kelvin, x273_15),
		// K + 273.15
		to: (value) => add(value, x273_15)
	},
	[TemperatureUnit.Delisle]: {
		// (K - 273.15) * 1.5 - 100
		from: (kelvin) => sub(mul(sub(kelvin, x273_15), x1_5), x100),
		// (K + 100) / 1.5 + 273.15
		to: (value) => add(div(add(value, x100), x1_5), x273_15)
	},
	[TemperatureUnit.Fahrenheit]: {
		// (K − 273.15) × 1.8 + 32
		from: (kelvin) => add(mul(sub(kelvin, x273_15), x1_8), x32),
		// (F − 32) / 1.8 + 273.15
		to: (value) => add(div(sub(value, x32), x1_8), x273_15)
	},
	[TemperatureUnit.GasMark]: {
		// (K − 273.15) × 0.55 + 1
		from: (kelvin) => add(mul(sub(kelvin, x273_15), x0_55), x1),
		// (GM − 1) / 0.55 + 273.15
		to: (value) => add(div(sub(value, x1), x0_55), x273_15)
	},
	[TemperatureUnit.Kelvin]: {
		// K
		from: (kelvin) => kelvin,
		// K
		to: (value) => value
	},
	[TemperatureUnit.Newton]: {
		// (K − 273.15) × 0.33
		from: (kelvin) => mul(sub(kelvin, x273_15), x0_33),
		// N / 0.33 + 273.15
		to: (value) => add(div(value, x0_33), x273_15)
	},
	[TemperatureUnit.Rankine]: {
		// (K − 273.15) × 1.8 + 491.67
		from: (kelvin) => add(mul(sub(kelvin, x273_15), x1_8), x491_67),
		// (R − 491.67) / 1.8 + 273.15
		to: (value) => add(sub(sub(value, x491_67), x1_8), x273_15)
	},
	[TemperatureUnit.Reaumur]: {
		// (K − 273.15) × 0.8
		from: (kelvin) => mul(sub(kelvin, x273_15), x0_8),
		// Re / 0.8 + 273.15
		to: (value) => add(div(value, x0_8), x273_15)
	},
	[TemperatureUnit.Romer]: {
		// (K − 273.15) × 0.525 + 7.5
		from: (kelvin) => add(mul(sub(kelvin, x273_15), x0_525), x7_5),
		// (Rø − 7.5) / 0.525 + 273.15
		to: (value) => add(div(sub(value, x7_5), x0_525), x273_15)
	}
};
