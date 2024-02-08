import _JSBD, { type Decimal } from 'jsbd';

export const JSBD = _JSBD as unknown as typeof import('jsbd').default;

// eslint-disable-next-line @typescript-eslint/unbound-method
const { BigDecimal, add, subtract: sub, divide: div, multiply: mul, equal: eq } = JSBD;
export { BigDecimal, add, sub, div, mul, eq };
export type { Decimal };
