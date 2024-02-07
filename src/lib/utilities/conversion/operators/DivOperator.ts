import { BaseOperator } from '#lib/utilities/conversion/operators/BaseOperator';
import { JSBD } from '#lib/utilities/conversion/BigDecimal';

export class DivOperator extends BaseOperator {
	public constructor(
		public readonly top: BaseOperator,
		public readonly bottom: BaseOperator
	) {
		super();
	}

	public override get value() {
		return JSBD.divide(this.top.value, this.bottom.value);
	}

	public override equals(other: BaseOperator): boolean {
		return (
			other instanceof DivOperator && //
			this.top.equals(other.top) &&
			this.bottom.equals(other.bottom)
		);
	}

	public override compatible(other: BaseOperator): boolean {
		return (
			other instanceof DivOperator && //
			this.top.compatible(other.top) &&
			this.bottom.compatible(other.bottom)
		);
	}

	public override toString(): string {
		return `${this.top.toString()} / ${this.bottom.toString()}`;
	}
}
