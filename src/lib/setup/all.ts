import '#lib/setup/logger';
import '#lib/setup/prisma';
import { run as redisRun } from '#lib/setup/redis';
import { run as remindersRun } from '#lib/setup/reminders';
import { setup as envRun } from '@skyra/env-utilities';
import { initializeSentry, setInvite, setRepository } from '@skyra/shared-http-pieces';

import '#lib/setup/canvas';
import '#lib/setup/schedules';
import '@skyra/shared-http-pieces/register';

export function setup() {
	envRun(new URL('../../../src/.env', import.meta.url));

	setRepository('teryl');
	setInvite('948377583626637343', '1074004032');
	initializeSentry();

	redisRun();
	remindersRun();
}
