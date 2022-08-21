import { HttpError } from '#lib/utilities/errors/HttpError';
import { err, ok, type Result } from '@sapphire/result';
import type { Awaitable, NonNullObject } from '@sapphire/utilities';

export async function safeFetch(input: RequestInfo | URL, init?: RequestInit) {
	try {
		const response = await fetch(input, init);
		if (response.ok) return ok(response);
		return err(new HttpError(response, await response.text()));
	} catch (error) {
		return err(error as Error);
	}
}

export async function safeTimedFetch(input: RequestInfo | URL, ms: number, init?: Omit<RequestInit, 'signal'>) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), ms);
	const result = await safeFetch(input, { ...init, signal: controller.signal });
	clearTimeout(timer);
	return result;
}

export async function json<T extends NonNullObject>(result: Awaitable<Result<Response, Error>>): Promise<Result<T, Error>> {
	return (await result).map((response) => response.json()).intoPromise();
}
