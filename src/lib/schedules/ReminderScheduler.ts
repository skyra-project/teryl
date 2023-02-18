import { BaseScheduler } from '#lib/schedules/BaseScheduler';
import type { Reminder } from '@prisma/client';
import { Result } from '@sapphire/result';
import { container } from '@skyra/http-framework';

export class ReminderScheduler extends BaseScheduler<ReminderScheduler.Data> {
	public override readonly name = 'reminders';

	protected async onAdd(id: string, value: ReminderScheduler.Data): Promise<void> {
		await container.prisma.reminder.create({ data: { id, ...value } });
	}

	protected async onRemove(id: string): Promise<boolean> {
		const result = await Result.fromAsync(container.prisma.reminder.delete({ where: { id }, select: null }));
		return result.isOk();
	}

	protected async onReschedule(id: string, time: number, extras?: Partial<ReminderScheduler.Data> | undefined): Promise<boolean> {
		const result = await Result.fromAsync(
			container.prisma.reminder.update({ where: { id }, data: { ...extras, time: new Date(time) }, select: null })
		);
		return result.isOk();
	}

	protected async handle(ids: readonly string[]): Promise<Reminder[]> {
		const values = await container.prisma.reminder.findMany({ where: { id: { in: ids as string[] } } });
		return values;
	}
}

export namespace ReminderScheduler {
	export type Data = Omit<Reminder, 'id'>;
}
