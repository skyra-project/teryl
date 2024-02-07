import type { Decimal } from '#lib/utilities/conversion/BigDecimal';

export abstract class BaseOperator {
	/**
	 * The value of the operator.
	 */
	public abstract get value(): Decimal;
	/**
	 * Determines if the operator is equal to another operator.
	 * @param other The other operator to compare to.
	 */
	public abstract equals(other: BaseOperator): boolean;

	/**
	 * Determines if the operator operates on compatible units.
	 * @param other The other operator to compare to.
	 */
	public abstract compatible(other: BaseOperator): boolean;

	/**
	 * Returns the string representation of the operator.
	 */
	public abstract toString(): string;
}
