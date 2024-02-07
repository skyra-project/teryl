import type { BaseOperator } from '#lib/utilities/conversion/operators/BaseOperator';
import { div, exp, mul, single } from '#lib/utilities/conversion/operators/utilities';
import { Units } from '#lib/utilities/conversion/units';

export function getTokens(input: string) {
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

/**
 * This function is called when the tokenizer requests the next unit.
 *
 * For example, when parsing `m/s`, the tokenizer will call this function upon encountering the `/` operator, returning
 * the next unit, `s`. The index is the position of the character after the `/` operator.
 *
 * If there are no more units, this function should throw an error.
 *
 * The method is called recursively, so you can use this to build a tree of operators and units.
 *
 * The method returns the next unit and the updated index at the end of the read unit.
 */
function getNextToken(input: string, index: number): [index: number, op: Operator] {
	if (index >= input.length) throw new Error('No more units');
	const char = input[index];
	if (char === '/' || char === '*') {
		// This is an operator, so we need to return the next unit.
		return getNextUnit(input, index + 1);
	}

	if (char === '^') {
		return { type: '^', value: getInteger(input, index + 1)[1] };
	}

	const superscript = superscriptIndex(char);
	if (superscript !== -1) {
		// This is a superscript, so we need to return the next unit.
		return getNextUnit(input, index + 1);
	}
}

function getInteger(input: string, index: number) {
	let value = 0;
	for (; index < input.length; index++) {
		const char = input[index];
		if (char < '0' || char > '9') break;
		else value = value * 10 + (char.charCodeAt(0) - 48);
	}

	return [index, value];
}

function getSuperscriptInteger(input: string, index: number, value: number) {
	for (; index < input.length; index++) {
		const char = input[index];
		const superscript = superscriptIndex(char);
		if (superscript === -1) break;
		else value = value * 10 + superscript;
	}

	return [index, value];
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
