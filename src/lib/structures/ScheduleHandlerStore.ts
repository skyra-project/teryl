import type { BaseScheduler } from '#lib/schedules/BaseScheduler';
import { ScheduleHandler } from '#lib/structures/ScheduleHandler';
import { isNullish } from '@sapphire/utilities';
import { Store } from '@skyra/http-framework';

export class ScheduleHandlerStore extends Store<ScheduleHandler> {
	public constructor() {
		super(ScheduleHandler, { name: 'schedule-handlers' });
	}

	public async run<T extends BaseScheduler.Value>(scheduler: BaseScheduler<T>, data: BaseScheduler.AddId<T>) {
		const handler = this.get(scheduler.name);
		if (isNullish(handler)) throw new TypeError(`Expected ${scheduler.name} to exist in the store, but it does not.`);

		try {
			const response = await handler.run(data);
			if (response.type === ScheduleHandler.Type.Reschedule) {
				await scheduler.reschedule(data.id, response.value);
			} else {
				await scheduler.remove(data.id);
			}
		} catch (error) {
			this.container.client.emit('error', error);
		}
	}
}
