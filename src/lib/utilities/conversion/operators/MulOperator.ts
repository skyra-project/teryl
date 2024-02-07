import { JSBD } from '#lib/utilities/conversion/BigDecimal';
import { BaseOperator } from '#lib/utilities/conversion/operators/BaseOperator';

export class MulOperator extends BaseOperator {
	public constructor(
		public readonly left: BaseOperator,
		public readonly right: BaseOperator
	) {
		super();
	}

	public override get value() {
		return JSBD.multiply(this.left.value, this.right.value);
	}

	public override equals(other: BaseOperator): boolean {
		return (
			other instanceof MulOperator && //
			this.left.equals(other.left) &&
			this.right.equals(other.right)
		);
	}

	public override compatible(other: BaseOperator): boolean {
		return (
			other instanceof MulOperator && //
			this.left.compatible(other.left) &&
			this.right.compatible(other.right)
		);
	}

	public override toString(): string {
		return `${this.left.toString()}·${this.right.toString()}`;
	}
}
