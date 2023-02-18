import { ScheduleHandlerStore } from '#lib/structures/ScheduleHandlerStore';
import { container } from '@skyra/http-framework';

container.stores.register(new ScheduleHandlerStore());

declare module '@sapphire/pieces' {
	interface StoreRegistryEntries {
		'schedule-handlers': ScheduleHandlerStore;
	}
}
