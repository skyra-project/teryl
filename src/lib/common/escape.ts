export function escapeInlineCode(text: string): string {
	return text.replaceAll('`', '῾');
}

export function escapeCodeBlock(text: string): string {
	return text.replaceAll('```', '῾῾῾');
}
