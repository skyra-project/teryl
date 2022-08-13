import { FT, T } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/choice:name');
export const RootDescription = T('commands/choice:description');

export const OptionsValues = 'commands/choice:optionsValues';
export const TooFewOptions = T('commands/choice:tooFewOptions');
export const DuplicatedOptions = T('commands/choice:duplicatedOptions');
export const Result = FT<{ value: string }>('commands/choice:result');
