import '#lib/setup/logger';
import { run as redisRun } from '#lib/setup/redis';

export function setup() {
	redisRun();
}
