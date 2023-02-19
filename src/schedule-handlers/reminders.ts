import type { ReminderScheduler } from '#lib/schedules/ReminderScheduler';
import { ScheduleHandler } from '#lib/structures/ScheduleHandler';

export class UserScheduleHandler extends ScheduleHandler<ReminderScheduler.Data> {
	public run(data: ReminderScheduler.Full) {
		// TODO: Write logic
		this.container.logger.info(data);
		return this.finish();
	}
}
