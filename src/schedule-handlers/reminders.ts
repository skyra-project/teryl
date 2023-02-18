import type { BaseScheduler } from '#lib/schedules/BaseScheduler';
import type { ReminderScheduler } from '#lib/schedules/ReminderScheduler';
import { ScheduleHandler } from '#lib/structures/ScheduleHandler';

export class UserScheduleHandler extends ScheduleHandler<ReminderScheduler.Data> {
	public run(data: BaseScheduler.AddId<ReminderScheduler.Data>) {
		this.container.logger.info(data);
		return this.finish();
	}
}
