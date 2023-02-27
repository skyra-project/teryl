export function cut(string: string, length: number): string {
	const codePoints = [...string];
	return codePoints.length <= length ? string : `${codePoints.slice(0, length - 3).join('')}...`;
}
