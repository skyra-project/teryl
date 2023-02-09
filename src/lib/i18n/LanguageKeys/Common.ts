import { FT, Value } from '@skyra/http-framework-i18n';

export const Currency = FT<Value<number>>('common:currency');
export const CurrencyFallback = FT<Value<number>>('common:currencyFallback');
