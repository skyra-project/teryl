import { Time } from '@sapphire/duration';
import { ok } from '@sapphire/result';
import { isNullishOrEmpty } from '@sapphire/utilities';
import { container } from '@skyra/http-framework';
import { blue, red } from '@skyra/logger';
import { Json, safeTimedFetch } from '@skyra/safe-fetch';
import { stringify } from 'node:querystring';

export async function get<Hit extends BaseHit>(endpoint: AlgoliaEndpoint<Hit>, query: string) {
	const cached = await getHitFromCache(endpoint, query);
	if (!isNullishOrEmpty(cached)) return ok(cached);

	const result = await request(endpoint, query);
	void result.inspectAsync((result) => storeResultToCache(endpoint, result));
	return result.map((result) => result.hits[0]);
}

export async function search<Hit extends BaseHit>(endpoint: AlgoliaEndpoint<Hit>, query: string) {
	const cached = await getResultFromCache(endpoint, query);
	if (!isNullishOrEmpty(cached)) return ok(cached);

	const result = await request(endpoint, query);
	void result.inspectAsync((result) => storeResultToCache(endpoint, result));
	return result.map((result) => result.hits);
}

function request<Hit extends BaseHit>(endpoint: AlgoliaEndpoint<Hit>, query: string) {
	container.logger.info(`[ALGOLIA] Fetching ${blue(endpoint.prefix)}:${red(query)}`);

	return Json<AlgoliaResult<Hit>>(
		safeTimedFetch(endpoint.url, Time.Second * 2, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Algolia-API-Key': endpoint.apiKey,
				'X-Algolia-Application-Id': endpoint.applicationId
			},
			body: JSON.stringify({
				params: stringify({
					hitsPerPage: 25,
					page: 0,
					query
				})
			})
		})
	);
}

async function storeResultToCache<Hit extends BaseHit>(endpoint: AlgoliaEndpoint<Hit>, result: AlgoliaResult<Hit>) {
	const pipeline = container.redis.pipeline();
	const keys: string[] = [];
	for (const hit of result.hits) {
		const key = `${endpoint.prefix}:hit:${endpoint.keyCallback(hit)}`;
		keys.push(key);
		pipeline.psetex(key, Time.Hour, JSON.stringify(hit));
	}

	pipeline.psetex(`${endpoint.prefix}:search:${result.query.toLowerCase()}`, Time.Hour, JSON.stringify(keys));
	await pipeline.exec();
}

async function getResultFromCache<Hit extends BaseHit>(endpoint: AlgoliaEndpoint<Hit>, query: string) {
	const jsonArray = await container.redis.get(`${endpoint.prefix}:search:${query.toLowerCase()}`);
	if (isNullishOrEmpty(jsonArray)) return null;

	const keys = JSON.parse(jsonArray) as string[];
	const jsonValues = await container.redis.mget(keys);
	const values: Hit[] = [];
	for (const jsonValue of jsonValues) {
		if (isNullishOrEmpty(jsonValue)) continue;
		values.push(JSON.parse(jsonValue));
	}

	return values;
}

async function getHitFromCache<Hit extends BaseHit>(endpoint: AlgoliaEndpoint<Hit>, query: string) {
	const jsonValue = await container.redis.get(`${endpoint.prefix}:hit:${query}`);
	return isNullishOrEmpty(jsonValue) ? null : (JSON.parse(jsonValue) as Hit);
}

export interface KeyCallback<Hit extends BaseHit> {
	(hit: Hit): string;
}

export interface AlgoliaEndpoint<Hit extends BaseHit> {
	url: URL | string;
	apiKey: string;
	applicationId: string;
	prefix: string;
	keyCallback: KeyCallback<Hit>;
}

export interface AlgoliaResult<Hit extends BaseHit> {
	hits: Hit[];
	nbHits: number;
	page: number;
	nbPages: number;
	hitsPerPage: number;
	exhaustiveNbHits: boolean;
	exhaustiveTypo: boolean;
	exhaustive: Exhaustive;
	query: string;
	params: string;
	renderingContent: RenderingContent;
	processingTimeMS: number;
	processingTimingsMS: ProcessingTimingsMS;
}

export interface BaseHit {
	lastModified: number;
	objectID: string;
	_distinctSeqID: number;
	_highlightResult: HighlightResult;
}

export interface Exhaustive {
	nbHits: boolean;
	typo: boolean;
}

export interface HighlightResult {
	nsuid: Nsuid;
	publishers: Nsuid[];
}

export interface Nsuid {
	value: string;
	matchLevel: string;
	matchedWords: string[];
	fullyHighlighted?: boolean;
}

export interface ProcessingTimingsMS {
	request: Request;
}

export interface Request {
	roundTrip: number;
}

export interface RenderingContent {}
