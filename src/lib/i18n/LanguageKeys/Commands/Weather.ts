import { FT, T, type Value } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/weather:name');
export const RootDescription = T('commands/weather:description');

export const OptionsPlace = 'commands/weather:optionsPlace';
export const OptionsSystem = 'commands/weather:optionsSystem';
export const OptionsSystemMetric = T('commands/weather:optionsSystemMetric');
export const OptionsSystemSI = T('commands/weather:optionsSystemSI');
export const OptionsSystemImperial = T('commands/weather:optionsSystemImperial');
export const OptionsSystemAuto = T('commands/weather:optionsSystemAuto');

export const InvalidJsonBody = T('commands/weather:invalidJsonBody');
export const UnknownLocation = T('commands/weather:unknownLocation');
export const UnknownError = T('commands/weather:unknownError');
export const AbortError = T('commands/weather:abortError');
export const BlockedLocation = T('commands/weather:blockedLocation');
export const RateLimited = T('commands/weather:rateLimited');
export const RemoteServerError = T('commands/weather:remoteServerError');
export const ServiceUnavailable = T('commands/weather:serviceUnavailable');
export const Inches = FT<Value>('commands/weather:inches');
export const TemperatureFahrenheit = FT<{ value: number; feelsLike: number }>('commands/weather:temperatureFahrenheit');
export const Miles = FT<Value>('commands/weather:miles');
export const MilesPerHour = FT<Value>('commands/weather:milesPerHour');
export const Millimeters = FT<Value>('commands/weather:millimeters');
export const Pascal = FT<Value>('commands/weather:pascal');
export const TemperatureKelvin = FT<Value>('commands/weather:temperatureKelvin');
export const TemperatureCelsius = FT<{ value: number; feelsLike: number }>('commands/weather:temperatureCelsius');
export const Kilometers = FT<Value>('commands/weather:kilometers');
export const KilometersPerHour = FT<Value>('commands/weather:kilometersPerHour');
export const MetersPerSecond = FT<Value>('commands/weather:metersPerSecond');
