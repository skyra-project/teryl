import { FT, T, Value } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/timezone:name');
export const RootDescription = T('commands/timezone:description');

export const OptionsName = 'commands/timezone:optionsName';
export const Use = 'commands/timezone:use';
export const UseSuccess = FT<Value>('commands/timezone:useSuccess');
export const UseFailure = FT<Value>('commands/timezone:useFailure');
export const Reset = 'commands/timezone:reset';
export const ResetSuccess = T('commands/timezone:resetSuccess');
export const ResetFailure = T('commands/timezone:resetFailure');
export const View = 'commands/timezone:view';
export const ViewContent = FT<{ tz: string; time: string }>('commands/timezone:viewContent');
export const InvalidTimeZone = FT<Value>('commands/timezone:invalidTimeZone');
