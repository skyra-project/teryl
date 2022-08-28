import { isNullishOrEmpty } from '@sapphire/utilities';
import { AsyncEventEmitter } from '@vladfrangu/async_event_emitter';
import type Redis from 'ioredis';
import { nanoid } from 'nanoid';

export abstract class BaseScheduler<T extends BaseScheduler.Value> extends AsyncEventEmitter<{
	message: [data: BaseScheduler.AddId<T>];
}> {
	public readonly redis: Redis;
	public readonly queue: string;
	public readonly interval: number;
	private _interval: NodeJS.Timer | null = null;

	public constructor(options: BaseScheduler.Options) {
		super();

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
		const count = await this.redis.zrem(this.queue, id);
		if (count === 0) return false;

		return this.onRemove(id);
	}

	protected abstract onAdd(id: string, value: T): Promise<void>;

	protected abstract onRemove(id: string): Promise<boolean>;

	protected abstract handle(ids: readonly string[]): Promise<BaseScheduler.AddId<T>[]>;

	private async requestPendingItems() {
		const ids = await this.redis.zrange(this.queue, 0, Date.now(), 'BYSCORE');
		if (isNullishOrEmpty(ids)) return;

		await this.redis.zrem(this.queue, ...ids);
		const values = await this.handle(ids);
		for (const value of values) this.emit('message', value);
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
