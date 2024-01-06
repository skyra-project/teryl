import { FT, type Value } from '@skyra/http-framework-i18n';

export const Currency = FT<Value<number>>('common:currency');

export const MilesPerHour = FT<Value>('common:milesPerHour');
export const KilometersPerHour = FT<Value>('common:kilometersPerHour');
export const MetersPerSecond = FT<Value>('commands/weather:metersPerSecond');
