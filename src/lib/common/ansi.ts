export function ansi8Foreground(code: number, content: string | number) {
	return `\x1b[38;5;${code}m${content}\x1b[39m`;
}

export function ansi8Background(code: number, content: string | number) {
	return `\x1b[48;5;${code}m${content}\x1b[39m`;
}
