import { FT, T, Value } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/reminders:name');
export const RootDescription = T('commands/reminders:description');

export const OptionsId = 'commands/reminders:optionsId';
export const OptionsContent = 'commands/reminders:optionsContent';
export const OptionsDuration = 'commands/reminders:optionsDuration';

export const Create = 'commands/reminders:create';
export const CreateContent = FT<{ id: string; time: string }>('commands/reminders:createContent');

export const Update = 'commands/reminders:update';
export const UpdateMissingOptions = T('commands/reminders:updateMissingOptions');

export const Delete = 'commands/reminders:delete';
export const DeleteContent = FT<{ id: string; time: string; content: string }>('commands/reminders:deleteContent');

export const List = 'commands/reminders:list';
export const ListEmpty = FT<{ commandId: string }>('commands/reminders:listEmpty');

export const InvalidId = FT<Value>('commands/reminders:invalidId');
export const InvalidDuration = FT<Value>('commands/reminders:invalidDuration');
