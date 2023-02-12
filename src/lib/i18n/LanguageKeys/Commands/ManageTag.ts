import { FT, T, type Value } from '@skyra/http-framework-i18n';

// Root
export const RootName = T('commands/manage-tag:name');
export const RootDescription = T('commands/manage-tag:description');

export const Add = 'commands/manage-tag:add';
export const Remove = 'commands/manage-tag:remove';
export const RemoveAll = 'commands/manage-tag:removeAll';
export const Edit = 'commands/manage-tag:edit';
export const Alias = 'commands/manage-tag:alias';
export const Source = 'commands/manage-tag:source';

export const OptionsName = 'commands/manage-tag:optionsName';
export const OptionsContent = 'commands/manage-tag:optionsContent';
export const OptionsEmbed = 'commands/manage-tag:optionsEmbed';
export const OptionsEmbedColor = 'commands/manage-tag:optionsEmbedColor';
export const OptionsNewName = 'commands/manage-tag:optionsNewName';

export const InvalidTagName = FT<Value>('commands/manage-tag:invalidTagName');

export const Modal = T('commands/manage-tag:modal');
export const ModalContent = T('commands/manage-tag:modalContent');

export const AddSuccess = FT<Value>('commands/manage-tag:addSuccess');
export const RemoveSuccess = FT<Value>('commands/manage-tag:removeSuccess');
export const RemoveAllSuccess = FT<Value<number>>('commands/manage-tag:removeAllSuccess');
export const RemoveAllNoEntries = T('commands/manage-tag:removeAllNoEntries');
export const EditSuccess = FT<Value>('commands/manage-tag:editSuccess');
export const AliasSuccess = FT<Value>('commands/manage-tag:aliasSuccess');
export const AliasSame = FT<Value>('commands/manage-tag:aliasSame');
export const AliasUsed = FT<Value>('commands/manage-tag:aliasUsed');
export const AliasIncompatible = FT<Value>('commands/manage-tag:aliasIncompatible');
export const AliasRemoveSuccess = FT<Value>('commands/manage-tag:aliasRemoveSuccess');
export const AliasRemoveFailed = FT<Value>('commands/manage-tag:aliasRemoveFailed');
export const TooManyAliases = FT<Value>('commands/manage-tag:tooManyAliases');
export const TooManyTags = FT<{ amount: number; limit: number }>('commands/manage-tag:tooManyTags');
export const AbortError = T('commands/manage-tag:abortError');
export const UnknownError = T('commands/manage-tag:unknownError');
export const Exists = FT<Value>('commands/manage-tag:exists');
export const Unknown = FT<Value>('commands/manage-tag:unknown');
