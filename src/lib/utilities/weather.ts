import { PathAssets } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { WeatherCode, type CurrentCondition, type Weather, type WeatherName } from '#lib/types/weather-types';
import { Result, err } from '@sapphire/result';
import { container } from '@skyra/http-framework';
import type { TypedT } from '@skyra/http-framework-i18n';
import { Text, isAbortError, safeTimedFetch, type FetchError } from '@skyra/safe-fetch';
import { Image, loadImage } from 'canvas-constructor/napi-rs';
import { cyan, gray, red } from 'colorette';
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

const getWeatherNameMap = new Map<WeatherCode, WeatherName>([
	[WeatherCode.ClearOrSunny, 'Sunny'],
	[WeatherCode.PartlyCloudy, 'PartlyCloudy'],
	[WeatherCode.Cloudy, 'Cloudy'],
	[WeatherCode.Overcast, 'VeryCloudy'],
	[WeatherCode.Mist, 'Fog'],
	[WeatherCode.PatchyRainNearby, 'LightShowers'],
	[WeatherCode.PatchySnowNearby, 'LightSleetShowers'],
	[WeatherCode.PatchySleetNearby, 'LightSleet'],
	[WeatherCode.PatchyFreezingDrizzleNearby, 'LightSleet'],
	[WeatherCode.ThunderyOutbreaksInNearby, 'ThunderyShowers'],
	[WeatherCode.BlowingSnow, 'LightSnow'],
	[WeatherCode.Blizzard, 'HeavySnow'],
	[WeatherCode.Fog, 'Fog'],
	[WeatherCode.FreezingFog, 'Fog'],
	[WeatherCode.PatchyLightDrizzle, 'LightShowers'],
	[WeatherCode.LightDrizzle, 'LightRain'],
	[WeatherCode.FreezingDrizzle, 'LightSleet'],
	[WeatherCode.HeavyFreezingDrizzle, 'LightSleet'],
	[WeatherCode.PatchyLightRain, 'LightRain'],
	[WeatherCode.LightRain, 'LightRain'],
	[WeatherCode.ModerateRainAtTimes, 'HeavyShowers'],
	[WeatherCode.ModerateRain, 'HeavyRain'],
	[WeatherCode.HeavyRainAtTimes, 'HeavyShowers'],
	[WeatherCode.HeavyRain, 'HeavyRain'],
	[WeatherCode.LightFreezingRain, 'LightSleet'],
	[WeatherCode.ModerateOrHeavyFreezingRain, 'LightSleet'],
	[WeatherCode.LightSleet, 'LightSleet'],
	[WeatherCode.ModerateOrHeavySleet, 'LightSnow'],
	[WeatherCode.PatchyLightSnow, 'LightSnowShowers'],
	[WeatherCode.LightSnow, 'LightSnowShowers'],
	[WeatherCode.PatchyModerateSnow, 'HeavySnow'],
	[WeatherCode.ModerateSnow, 'HeavySnow'],
	[WeatherCode.PatchyHeavySnow, 'HeavySnowShowers'],
	[WeatherCode.HeavySnow, 'HeavySnow'],
	[WeatherCode.IcePellets, 'LightSleet'],
	[WeatherCode.LightRainShower, 'LightShowers'],
	[WeatherCode.ModerateOrHeavyRainShower, 'HeavyShowers'],
	[WeatherCode.TorrentialRainShower, 'HeavyShowers'],
	[WeatherCode.LightSleetShowers, 'LightSleetShowers'],
	[WeatherCode.ModerateOrHeavySleetShowers, 'LightSleetShowers'],
	[WeatherCode.LightSnowShowers, 'LightSnowShowers'],
	[WeatherCode.ModerateOrHeavySnowShowers, 'LightSnowShowers'],
	[WeatherCode.LightShowersOfIcePellets, 'LightSleetShowers'],
	[WeatherCode.ModerateOrHeavyShowersOfIcePellets, 'LightSleet'],
	[WeatherCode.PatchyLightRainInAreaWithThunder, 'ThunderyShowers'],
	[WeatherCode.ModerateOrHeavyRainInAreaWithThunder, 'ThunderyHeavyRain'],
	[WeatherCode.PatchyLightSnowInAreaWithThunder, 'ThunderySnowShowers'],
	[WeatherCode.ModerateOrHeavySnowInAreaWithThunder, 'ThunderySnowShowers']
]);
export function getWeatherName(code: WeatherCode): WeatherName {
	const name = getWeatherNameMap.get(code);
	if (name === undefined) throw new Error(`The code '${code}' is not available.`);
	return name;
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

const getDataBaseURL = 'https://wttr.in/';
export async function getData(query: string, lang: string): Promise<Result<Weather, TypedT>> {
	const url = new URL(`${getDataBaseURL}~${encodeURIComponent(query)}`);
	url.searchParams.append('format', 'j1');
	url.searchParams.append('lang', lang);

	const result = await Text(safeTimedFetch(url, 2000));
	return result.match({
		ok: (value) => getDataOk(value),
		err: (error) => getDataErr(error)
	});
}

function getDataOk(value: string) {
	// JSON object:
	if (value.startsWith('{')) {
		return Result.from(() => JSON.parse(value) as Weather).mapErr(() => LanguageKeys.Commands.Weather.InvalidJsonBody);
	}

	// Yes, wttr.in returns 200 OK on errors (ref: https://github.com/chubin/wttr.in/issues/591).
	// "Unknown location; ..." message:
	if (value.startsWith('Unknown location')) {
		return err(LanguageKeys.Commands.Weather.UnknownLocation);
	}

	// Log the error and return unknown error:
	container.logger.error(`[${cyan('WEATHER')}]: Unknown Error Body Received: ${gray(value)}`);
	return err(LanguageKeys.Commands.Weather.UnknownError);
}

function getDataErr(error: FetchError) {
	if (isAbortError(error)) return err(LanguageKeys.Commands.Weather.AbortError);
	if (error.code === 403) return err(LanguageKeys.Commands.Weather.BlockedLocation);
	if (error.code === 429) return err(LanguageKeys.Commands.Weather.RateLimited);
	if (error.code === 500) return err(LanguageKeys.Commands.Weather.RemoteServerError);
	if (error.code === 503) return err(LanguageKeys.Commands.Weather.ServiceUnavailable);

	// Log the error and return unknown error:
	container.logger.error(`[${cyan('WEATHER')}]: Unknown Error Code Received: ${red(error.code.toString())} - ${gray(error.body)}`);
	return err(LanguageKeys.Commands.Weather.UnknownError);
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
		windSpeed: t(LanguageKeys.Common.MilesPerHour, { value: Number(conditions.windspeedMiles) })
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
			? t(LanguageKeys.Common.MetersPerSecond, { value: kilometersPerHourToMetersPerSecond(windSpeed) })
			: t(LanguageKeys.Common.KilometersPerHour, { value: windSpeed })
	};
}

export interface ConditionsOptions {
	si?: boolean;
}

function kilometersPerHourToMetersPerSecond(kmh: number): number {
	return kmh / 3.6;
}

function celsiusToKelvin(celsius: number): number {
	return celsius + 273.15;
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
