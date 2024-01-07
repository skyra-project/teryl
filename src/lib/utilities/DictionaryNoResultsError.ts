export class DictionaryNoResultsError extends Error {
	public constructor() {
		super('No results found.');
	}
}
