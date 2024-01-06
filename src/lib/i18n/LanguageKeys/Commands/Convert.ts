import { FT, T } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/convert:name');
export const RootDescription = T('commands/convert:description');

export const Amount = 'commands/convert:amount';
export const From = 'commands/convert:from';
export const To = 'commands/convert:to';

export const Result = FT<{ from: string; to: string }>('commands/convert:result');

export const Length = 'commands/convert:length';
export const LengthAstronomicalUnit = T('commands/convert:lengthAstronomicalUnit');
export const LengthFeet = T('commands/convert:lengthFeet');
export const LengthInch = T('commands/convert:lengthInch');
export const LengthKilometer = T('commands/convert:lengthKilometer');
export const LengthLightSecond = T('commands/convert:lengthLightSecond');
export const LengthLightYear = T('commands/convert:lengthLightYear');
export const LengthMeter = T('commands/convert:lengthMeter');
export const LengthCentimeter = T('commands/convert:lengthCentimeter');
export const LengthMile = T('commands/convert:lengthMile');
export const LengthNauticalMile = T('commands/convert:lengthNauticalMile');
export const LengthParsec = T('commands/convert:lengthParsec');

export const Mass = 'commands/convert:mass';
export const MassElectronVolt = T('commands/convert:massElectronVolt');
export const MassGrain = T('commands/convert:massGrain');
export const MassGram = T('commands/convert:massGram');
export const MassKilogram = T('commands/convert:massKilogram');
export const MassOunce = T('commands/convert:massOunce');
export const MassTon = T('commands/convert:massTon');
export const MassTonne = T('commands/convert:massTonne');

export const Time = 'commands/convert:time';
export const TimeCentury = T('commands/convert:timeCentury');
export const TimeDay = T('commands/convert:timeDay');
export const TimeDecade = T('commands/convert:timeDecade');
export const TimeHour = T('commands/convert:timeHour');
export const TimeLunarYear = T('commands/convert:timeLunarYear');
export const TimeMillennium = T('commands/convert:timeMillennium');
export const TimeMinute = T('commands/convert:timeMinute');
export const TimeMonth = T('commands/convert:timeMonth');
export const TimeSecond = T('commands/convert:timeSecond');
export const TimeTropicalMonth = T('commands/convert:timeTropicalMonth');
export const TimeTropicalYear = T('commands/convert:timeTropicalYear');
export const TimeWeek = T('commands/convert:timeWeek');

export const Temperature = 'commands/convert:temperature';
export const TemperatureCelsius = T('commands/convert:temperatureCelsius');
export const TemperatureDelisle = T('commands/convert:temperatureDelisle');
export const TemperatureFahrenheit = T('commands/convert:temperatureFahrenheit');
export const TemperatureNewton = T('commands/convert:temperatureNewton');
export const TemperatureRankine = T('commands/convert:temperatureRankine');
export const TemperatureReaumur = T('commands/convert:temperatureReaumur');
export const TemperatureRomer = T('commands/convert:temperatureRomer');
export const TemperatureKelvin = T('commands/convert:temperatureKelvin');

export const Speed = 'commands/convert:speed';
export const SpeedNauticalMilesPerHour = T('commands/convert:speedNauticalMilesPerHour');
export const SpeedFeetPerSecond = T('commands/convert:speedFeetPerSecond');
export const SpeedLightSpeed = T('commands/convert:speedLightSpeed');
export const SpeedMachNumber = T('commands/convert:speedMachNumber');
export const SpeedNaturalUnit = T('commands/convert:speedNaturalUnit');

export const UnitAstronomicalUnit = FT<{ value: number }>('commands/convert:unitAstronomicalUnit');
export const UnitFeet = FT<{ value: number }>('commands/convert:unitFeet');
export const UnitInch = FT<{ value: number }>('commands/convert:unitInch');
export const UnitKilometer = FT<{ value: number }>('commands/convert:unitKilometer');
export const UnitLightSecond = FT<{ value: number }>('commands/convert:unitLightSecond');
export const UnitLightYear = FT<{ value: number }>('commands/convert:unitLightYear');
export const UnitMeter = FT<{ value: number }>('commands/convert:unitMeter');
export const UnitCentimeter = FT<{ value: number }>('commands/convert:unitCentimeter');
export const UnitMile = FT<{ value: number }>('commands/convert:unitMile');
export const UnitNauticalMile = FT<{ value: number }>('commands/convert:unitNauticalMile');
export const UnitParsec = FT<{ value: number }>('commands/convert:unitParsec');

export const UnitElectronVolt = FT<{ value: number }>('commands/convert:unitElectronVolt');
export const UnitGrain = FT<{ value: number }>('commands/convert:unitGrain');
export const UnitGram = FT<{ value: number }>('commands/convert:unitGram');
export const UnitKilogram = FT<{ value: number }>('commands/convert:unitKilogram');
export const UnitOunce = FT<{ value: number }>('commands/convert:unitOunce');
export const UnitTon = FT<{ value: number }>('commands/convert:unitTon');
export const UnitTonne = FT<{ value: number }>('commands/convert:unitTonne');

export const UnitCentury = FT<{ value: number }>('commands/convert:unitCentury');
export const UnitDay = FT<{ value: number }>('commands/convert:unitDay');
export const UnitDecade = FT<{ value: number }>('commands/convert:unitDecade');
export const UnitHour = FT<{ value: number }>('commands/convert:unitHour');
export const UnitLunarYear = FT<{ value: number }>('commands/convert:unitLunarYear');
export const UnitMillennium = FT<{ value: number }>('commands/convert:unitMillennium');
export const UnitMinute = FT<{ value: number }>('commands/convert:unitMinute');
export const UnitMonth = FT<{ value: number }>('commands/convert:unitMonth');
export const UnitSecond = FT<{ value: number }>('commands/convert:unitSecond');
export const UnitTropicalMonth = FT<{ value: number }>('commands/convert:unitTropicalMonth');
export const UnitTropicalYear = FT<{ value: number }>('commands/convert:unitTropicalYear');
export const UnitWeek = FT<{ value: number }>('commands/convert:unitWeek');

export const UnitCelsius = FT<{ value: number }>('commands/convert:unitCelsius');
export const UnitDelisle = FT<{ value: number }>('commands/convert:unitDelisle');
export const UnitFahrenheit = FT<{ value: number }>('commands/convert:unitFahrenheit');
export const UnitNewton = FT<{ value: number }>('commands/convert:unitNewton');
export const UnitRankine = FT<{ value: number }>('commands/convert:unitRankine');
export const UnitReaumur = FT<{ value: number }>('commands/convert:unitReaumur');
export const UnitRomer = FT<{ value: number }>('commands/convert:unitRomer');
export const UnitKelvin = FT<{ value: number }>('commands/convert:unitKelvin');

export const UnitNauticalMilesPerHour = FT<{ value: number }>('commands/convert:unitNauticalMilesPerHour');
export const UnitFeetPerSecond = FT<{ value: number }>('commands/convert:unitFeetPerSecond');
export const UnitLightSpeed = FT<{ value: number }>('commands/convert:unitLightSpeed');
export const UnitMachNumber = FT<{ value: number }>('commands/convert:unitMachNumber');
export const UnitNaturalUnit = FT<{ value: number }>('commands/convert:unitNaturalUnit');
