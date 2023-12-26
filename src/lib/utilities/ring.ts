import { ok } from '@sapphire/result';
import { envParseString } from '@skyra/env-utilities';
import { Json, safeTimedFetch } from '@skyra/safe-fetch';

const InternalRingUrl = envParseString('INTERNAL_RING_URL');
const InternalRingHeaders = {
	authorization: envParseString('INTERNAL_RING_TOKEN', 'NULL'),
	'content-type': 'application/json'
};

export function fetchLimits(guildId: string | bigint) {
	if (InternalRingHeaders.authorization === 'NULL') return Promise.resolve(ok(DefaultLimits));
	return Json<RingLimits>(safeTimedFetch(`${InternalRingUrl}/${guildId}`, 1000, { headers: InternalRingHeaders }));
}

export const DefaultLimits = { maximumTagCount: 50 } as const satisfies RingLimits;

export interface RingLimits {
	maximumTagCount: number;
}
