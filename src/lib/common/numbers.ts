import { round } from 'culori';

export const round2 = round(2);
export const round6 = round(6);
export function clamp256(value: number) {
	return Math.round(Math.max(0, Math.min(1, value)) * 255);
}
