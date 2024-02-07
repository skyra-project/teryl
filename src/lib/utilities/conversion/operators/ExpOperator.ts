import { BaseOperator } from '#lib/utilities/conversion/operators/BaseOperator';

export class ExpOperator extends BaseOperator {
	public constructor(
		public readonly operator: BaseOperator,
		public readonly exponent: number
	) {
		super();
	}

	public override get value() {
		return this.operator.value;
	}

	public override equals(other: BaseOperator): boolean {
		return (
			other instanceof ExpOperator && //
			this.operator.equals(other.operator) &&
			this.exponent === other.exponent
		);
	}

	public override compatible(other: BaseOperator): boolean {
		return (
			other instanceof ExpOperator && //
			this.operator.compatible(other.operator) &&
			this.exponent === other.exponent
		);
	}

	public override toString(): string {
		return `${this.operator.toString()}${this.getExponentString()}`;
	}

	private getExponentString() {
		if (this.exponent === 1) return '';
		// ⁰¹²³⁴⁵⁶⁷⁸⁹
		let exp = this.exponent;
		let result = '';
		if (exp < 0) {
			exp = -exp;
			result = '⁻';
		}

		while (exp > 0) {
			result = `${ExpOperator.ExponentCharacters[exp % 10]}${result}`;
			exp = Math.floor(exp / 10);
		}

		return result;
	}

	private static readonly ExponentCharacters = '⁰¹²³⁴⁵⁶⁷⁸⁹';
}
