import { isNullishOrEmpty } from '@sapphire/utilities';
import { container } from '@skyra/http-framework';
import type Redis from 'ioredis';
import { nanoid } from 'nanoid';

export abstract class BaseScheduler<T extends BaseScheduler.Value> {
	public abstract readonly name: string;
	public readonly redis: Redis;
	public readonly queue: string;
	public readonly interval: number;
	public _lastMaximum = 0;
	private _interval: NodeJS.Timer | null = null;

	public constructor(options: BaseScheduler.Options) {
		this.redis = options.redis;
		this.queue = options.queue;
		this.interval = options.interval ?? 1000;
	}

	public start() {
		if (this._interval) this._interval.refresh();
		else this._interval = setInterval(() => this.requestPendingItems(), this.interval);
	}

	public stop() {
		if (this._interval) {
			clearInterval(this._interval);
			this._interval = null;
		}
	}

	public async add(value: T): Promise<string> {
		const id = nanoid();
		await this.redis.zadd(this.queue, value.time.getTime(), id);
		await this.onAdd(id, value);
		return id;
	}

	public async remove(id: string): Promise<boolean> {
		const result = await this.onRemove(id);
		const count = await this.redis.zrem(this.queue, id);
		return result || count !== 0;
	}

	public async reschedule(id: string, time: number, extras?: Partial<T>): Promise<boolean> {
		const result = await this.onReschedule(id, time, extras);
		const count = await this.redis.zadd(this.queue, 'XX', 'CH', time, id);
		return result || count !== 0;
	}

	protected abstract onAdd(id: string, value: T): Promise<void>;

	protected abstract onRemove(id: string): Promise<boolean>;

	protected abstract onReschedule(id: string, time: number, extras?: Partial<T>): Promise<boolean>;

	protected abstract handle(ids: readonly string[]): Promise<BaseScheduler.AddId<T>[]>;

	private async requestPendingItems() {
		const min = this._lastMaximum;
		// eslint-disable-next-line no-multi-assign
		const max = (this._lastMaximum = Date.now());
		const ids = await this.redis.zrange(this.queue, min, max, 'BYSCORE');
		if (isNullishOrEmpty(ids)) return;

		const values = await this.handle(ids);
		const store = container.stores.get('schedule-handlers');
		for (const value of values) {
			void store.run(this, value);
		}
	}
}

export namespace BaseScheduler {
	export interface Options {
		redis: Redis;
		queue: string;
		interval?: number;
	}

	export interface Value {
		time: Date;
	}

	export type AddId<T> = T & { id: string };
}
