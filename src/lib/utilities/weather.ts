import { PathAssets } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { celsiusToKelvin, kilometersPerHourToMetersPerSecond, type CurrentCondition, type WeatherName } from '@skyra/weather-helpers';
import { Image, loadImage } from 'canvas-constructor/napi-rs';
import type { TFunction } from 'i18next';
import { join } from 'node:path';
import { URL, fileURLToPath } from 'node:url';

export function getColors(name: WeatherName): WeatherTheme {
	switch (name) {
		case 'LightShowers':
		case 'LightSleetShowers':
		case 'LightSnowShowers':
		case 'LightRain':
		case 'LightSleet':
		case 'LightSnow':
		case 'HeavySnow':
		case 'HeavySnowShowers':
		case 'Cloudy':
		case 'Fog':
			return { background: '#2E2E2E', text: '#FAFAFA', theme: 'light' };
		case 'HeavyRain':
		case 'HeavyShowers':
		case 'VeryCloudy':
			return { background: '#EAEAEA', text: '#1F1F1F', theme: 'dark' };
		case 'PartlyCloudy':
		case 'Sunny':
			return { background: '#0096D6', text: '#FAFAFA', theme: 'light' };
		case 'ThunderyHeavyRain':
		case 'ThunderyShowers':
		case 'ThunderySnowShowers':
			return { background: '#99446B', text: '#FAFAFA', theme: 'light' };
		default:
			throw new Error(`Could not find weather name '${name}'.`);
	}
}

const PathWeather = fileURLToPath(new URL('./images/weather', PathAssets));
const getFileCache = new Map<WeatherName, Image>();
export async function getFile(name: WeatherName): Promise<Image> {
	const existing = getFileCache.get(name);
	if (existing !== undefined) return existing;

	const image = await loadImage(join(PathWeather, `${name}.png`));
	getFileCache.set(name, image);
	return image;
}

const getIconsCache = new Map<Theme, Icons>();
export async function getIcons(theme: Theme): Promise<Icons> {
	const existing = getIconsCache.get(theme);
	if (existing !== undefined) return existing;

	const [pointer, precipitation, temperature, visibility] = await Promise.all([
		loadImage(join(PathWeather, theme, 'pointer.png')),
		loadImage(join(PathWeather, theme, 'precipitation.png')),
		loadImage(join(PathWeather, theme, 'temperature.png')),
		loadImage(join(PathWeather, theme, 'visibility.png'))
	]);

	const icons: Icons = { pointer, precipitation, temperature, visibility };
	getIconsCache.set(theme, icons);
	return icons;
}

export function resolveCurrentConditionsImperial(conditions: CurrentCondition, t: TFunction): ResolvedConditions {
	return {
		precipitation: t(LanguageKeys.Commands.Weather.Inches, { value: Number(conditions.precipInches) }),
		pressure: t(LanguageKeys.Commands.Weather.Inches, { value: Number(conditions.pressureInches) }),
		temperature: t(LanguageKeys.Commands.Weather.TemperatureFahrenheit, {
			value: Number(conditions.temp_F),
			feelsLike: Number(conditions.FeelsLikeF)
		}),
		visibility: t(LanguageKeys.Commands.Weather.Miles, { value: Number(conditions.visibilityMiles) }),
		windSpeed: t(LanguageKeys.Commands.Weather.MilesPerHour, { value: Number(conditions.windspeedMiles) })
	};
}

export function resolveCurrentConditionsMetric(conditions: CurrentCondition, t: TFunction, options: ConditionsOptions = {}): ResolvedConditions {
	const si = options.si ?? false;
	const temperature = Number(conditions.temp_C);
	const windSpeed = Number(conditions.windspeedKmph);
	return {
		precipitation: t(LanguageKeys.Commands.Weather.Millimeters, { value: Number(conditions.precipMM) }),
		pressure: t(LanguageKeys.Commands.Weather.Pascal, { value: Number(conditions.pressure) }),
		temperature: si
			? t(LanguageKeys.Commands.Weather.TemperatureKelvin, { value: celsiusToKelvin(temperature) })
			: t(LanguageKeys.Commands.Weather.TemperatureCelsius, { value: temperature, feelsLike: Number(conditions.FeelsLikeC) }),
		visibility: t(LanguageKeys.Commands.Weather.Kilometers, { value: Number(conditions.visibility) }),
		windSpeed: si
			? t(LanguageKeys.Commands.Weather.MetersPerSecond, { value: kilometersPerHourToMetersPerSecond(windSpeed) })
			: t(LanguageKeys.Commands.Weather.KilometersPerHour, { value: windSpeed })
	};
}

export interface ConditionsOptions {
	si?: boolean;
}

export type Theme = 'light' | 'dark';

export interface WeatherTheme {
	background: `#${string}`;
	text: `#${string}`;
	theme: Theme;
}

export interface ResolvedConditions {
	precipitation: string;
	pressure: string;
	temperature: string;
	visibility: string;
	windSpeed: string;
}

export interface Icons {
	pointer: Image;
	precipitation: Image;
	temperature: Image;
	visibility: Image;
}
