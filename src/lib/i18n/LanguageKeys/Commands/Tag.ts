import { FT, T } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/tag:name');
export const RootDescription = T('commands/tag:description');

export const OptionsName = 'commands/tag:optionsName';
export const OptionsHide = 'commands/tag:optionsHide';
export const OptionsTarget = 'commands/tag:optionsTarget';
export const Unknown = T('commands/tag:unknown');
export const Target = FT<{ user: string }>('commands/tag:target');
