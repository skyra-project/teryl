import _JSBD, { type Decimal } from 'jsbd';

export const JSBD = _JSBD as unknown as typeof import('jsbd').default;

// eslint-disable-next-line @typescript-eslint/unbound-method
const { BigDecimal } = JSBD;
export { BigDecimal };
export type { Decimal };
