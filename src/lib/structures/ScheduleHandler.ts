import type { BaseScheduler } from '#lib/schedules/BaseScheduler';
import type { Awaitable } from '@sapphire/utilities';
import { Piece } from '@skyra/http-framework';

export abstract class ScheduleHandler<T extends BaseScheduler.Value = BaseScheduler.Value> extends Piece {
	public abstract run(data: BaseScheduler.AddId<T>): Awaitable<ScheduleHandler.Result>;

	/**
	 * @param ms The duration in milliseconds.
	 */
	protected delay(ms: number): ScheduleHandler.Reschedule {
		return { type: ScheduleHandler.Type.Reschedule, value: Date.now() + ms };
	}

	protected finish(): ScheduleHandler.Finish {
		return { type: ScheduleHandler.Type.Finish };
	}
}

export namespace ScheduleHandler {
	export const enum Type {
		Reschedule,
		Finish
	}

	export type Result = Finish | Reschedule;

	export interface Finish {
		type: Type.Finish;
	}

	export interface Reschedule {
		type: Type.Reschedule;
		value: number;
	}
}
