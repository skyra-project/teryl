export function escapeInlineBlock(text: string): string {
	return text.replaceAll('`', '῾');
}

export function escapeCodeBlock(text: string): string {
	return text.replaceAll('```', '῾῾῾');
}
