import { BaseOperator } from '#lib/utilities/conversion/operators/BaseOperator';
import type { Unit } from '#lib/utilities/conversion/units';

export class SingleOperator extends BaseOperator {
	public constructor(public readonly unit: Unit) {
		super();
	}

	public override get value() {
		return this.unit.value;
	}

	public override equals(other: BaseOperator): boolean {
		return other instanceof SingleOperator && this.unit === other.unit;
	}

	public override compatible(other: BaseOperator): boolean {
		return other instanceof SingleOperator && this.unit.types.some((type) => other.unit.types.includes(type));
	}

	public override toString(): string {
		return this.unit.symbol;
	}
}
