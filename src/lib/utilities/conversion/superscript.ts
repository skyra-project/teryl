/**
 * @param value An integer numeric string
 */
export function toSuperscript(value: string): string {
	return [...value]
		.map((char) => {
			const code = char.charCodeAt(0);
			return code < c0 || code > c9 ? char : superscript[code - c0];
		})
		.join('');
}

const c0 = '0'.charCodeAt(0);
const c9 = '9'.charCodeAt(0);
const superscript = '⁰¹²³⁴⁵⁶⁷⁸⁹';
