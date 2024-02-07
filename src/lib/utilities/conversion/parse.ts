import type { BaseOperator } from '#lib/utilities/conversion/operators/BaseOperator';
import { div, exp, mul, single } from '#lib/utilities/conversion/operators/utilities';
import { Units } from '#lib/utilities/conversion/units.js';

export function parse(input: string): number {
	// m/s becomes div(single(m), single(s))
	// m/s² becomes div(single(m), exp(single(s), 2))
	// m/s^2 becomes div(single(m), exp(single(s), 2))
	// kg⋅K becomes mul(single(kg), single(K))
	// kg*K becomes mul(single(kg), single(K))
	// kg K becomes mul(single(kg), single(K))

	return parseFloat(input);
}

function getTokens(input: string) {
	// input = 'm/s' becomes single(m), operator(/), single(s)
	// input = 'm/s²' becomes single(m), operator(/), exp(single(s), 2)
	// input = 'm/s^2' becomes single(m), operator(/), exp(single(s), 2)
	// input = 'kg⋅K' becomes single(kg), operator(*), single(K)
	// input = 'kg*K' becomes single(kg), operator(*), single(K)
	// input = 'kg K' becomes single(kg), operator(*), single(K)

	const operators: Operator[] = [];
	const units: BaseOperator[] = [];

	let current = '';
	let exponent = 0;
	for (const char of input) {
		if (char === '/' || char === '*' || char === '^') {
			operators.push({ type: char as '/' | '*' | '^' });
			if (current.length > 0) {
				units.push(single(get(current)));
				current = '';
			} else if (exponent > 0) {
				units.push(exp(units.pop()!, exponent));
				exponent = 0;
			}
			continue;
		}

		const superscript = superscriptIndex(char);
		if (superscript !== -1) {
			exponent = exponent * 10 + superscript;
			continue;
		}

		current += char;
	}
}

function get(unit: string) {
	const value = Units.find((u) => u.symbol === unit);
	if (value) return value;
	throw new Error(`Unknown unit: ${unit}`);
}

function superscriptIndex(char: string) {
	return '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(char);
}

interface Operator {
	readonly type: '/' | '*' | '^';
	readonly value?: number;
}

void single;
void mul;
void div;
void exp;
