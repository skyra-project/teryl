import type { BaseOperator } from '#lib/utilities/conversion/operators/BaseOperator';
import { DivOperator } from '#lib/utilities/conversion/operators/DivOperator';
import { ExpOperator } from '#lib/utilities/conversion/operators/ExpOperator';
import { MulOperator } from '#lib/utilities/conversion/operators/MulOperator';
import { SingleOperator } from '#lib/utilities/conversion/operators/SingleOperator';
import type { Unit } from '#lib/utilities/conversion/units';

export function single(unit: Unit): SingleOperator {
	return new SingleOperator(unit);
}

export function mul(left: BaseOperator, right: BaseOperator): MulOperator {
	return new MulOperator(left, right);
}

export function div(top: BaseOperator, bottom: BaseOperator): DivOperator {
	return new DivOperator(top, bottom);
}

export function exp(operator: BaseOperator, exponent: number): BaseOperator {
	return new ExpOperator(operator, exponent);
}
