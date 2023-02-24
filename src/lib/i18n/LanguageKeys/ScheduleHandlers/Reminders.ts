import { FT } from '@skyra/http-framework-i18n';

export const Public = FT<{ time: string; users: string[] }>('schedule-handlers/reminders:public');
export const Private = FT<{ time: string }>('schedule-handlers/reminders:private');
