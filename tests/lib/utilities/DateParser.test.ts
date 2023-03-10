import { DateParser } from '#lib/utilities/DateParser';
import type { LocaleString } from 'discord-api-types/v10';
import { Duration, type DurationLikeObject } from 'luxon';

const enUS: LocaleString = 'en-US';
const enGB: LocaleString = 'en-GB';

describe('DateParser', () => {
	describe('constructor', () => {
		describe('invalid', () => {
			test('GIVEN empty string THEN returns invalid', () => {
				const value = new DateParser('', enUS);
				expect(value.year).toBeNull();
				expect(value.month).toBeNull();
				expect(value.day).toBeNull();
				expect(value.hour).toBeNull();
				expect(value.minute).toBeNull();
				expect(value.second).toBeNull();
				expect(value.valid).toBe(false);
			});

			test.each([enUS, enGB])('GIVEN false positive (1.5w) with %s locale THEN returns invalid', (locale) => {
				const value = new DateParser('1.5w', locale);
				expect(value.valid).toBe(false);
			});

			test.each([enUS, enGB])('GIVEN false positive (1.5 weeks) with %s locale THEN returns invalid', (locale) => {
				const value = new DateParser('1.5 weeks', locale);
				expect(value.valid).toBe(false);
			});
		});

		describe('date', () => {
			function validate(value: DateParser) {
				expect(value.year).toBe(2023);
				expect(value.month).toBe(3);
				expect(value.day).toBe(10);
				expect(value.hour).toBeNull();
				expect(value.minute).toBeNull();
				expect(value.second).toBeNull();
				expect(value.valid).toBe(true);
			}

			test.each([
				['YYYY/MM/DD', '2023/03/10'],
				['YYYY-MM-DD', '2023-03-10'],
				['YYYY.MM.DD', '2023.03.10']
			])('GIVEN %s THEN it resolves to the correct date', (_description, date) => {
				validate(new DateParser(date, enUS));
			});

			test.each([
				['MM/DD/YYYY', '03/10/2023'],
				['MM-DD-YYYY', '03-10-2023'],
				['MM.DD.YYYY', '03.10.2023'],
				['MM/DD/YY', '03/10/23'],
				['MM-DD-YY', '03-10-23'],
				['MM.DD.YY', '03.10.23']
			])('GIVEN %s with en-US THEN it resolves to the correct date', (_description, date) => {
				validate(new DateParser(date, enUS));
			});

			test.each([
				['DD/MM/YYYY', '10/03/2023'],
				['DD-MM-YYYY', '10-03-2023'],
				['DD.MM.YYYY', '10.03.2023'],
				['DD/MM/YY', '10/03/23'],
				['DD-MM-YY', '10-03-23'],
				['DD.MM.YY', '10.03.23']
			])('GIVEN %s with en-GB THEN it resolves to the correct date', (_description, date) => {
				validate(new DateParser(date, enGB));
			});

			test.each([
				['15/03/2023', enUS],
				['03/15/2023', enGB]
			])('GIVEN %s with %s locale THEN it swaps days and months', (input, locale) => {
				const value = new DateParser(input, locale);
				expect(value.year).toBe(2023);
				expect(value.month).toBe(3);
				expect(value.day).toBe(15);
				expect(value.hour).toBeNull();
				expect(value.minute).toBeNull();
				expect(value.second).toBeNull();
				expect(value.valid).toBe(true);
			});
		});

		describe('time', () => {
			function validate(value: DateParser) {
				expect(value.year).toBeNull();
				expect(value.month).toBeNull();
				expect(value.day).toBeNull();
				expect(value.valid).toBe(true);
			}

			describe('hours', () => {
				test.each(['20:00', '20', '20pm', '8pm'])('GIVEN %s THEN it resolves to 20:00', (time) => {
					const value = new DateParser(time, enUS);
					validate(value);
					expect(value.hour).toBe(20);
					expect(value.minute).toBe(0);
					expect(value.second).toBe(0);
				});

				test.each(['08:00', '8:00', '8', '8am', '20am'])('GIVEN %s THEN it resolves to 08:00', (time) => {
					const value = new DateParser(time, enUS);
					validate(value);
					expect(value.hour).toBe(8);
					expect(value.minute).toBe(0);
					expect(value.second).toBe(0);
				});
			});

			describe('minutes', () => {
				test.each(['20:05', '20:5', '20:05pm', '8:5pm'])('GIVEN %s THEN it resolves to 20:05', (time) => {
					const value = new DateParser(time, enUS);
					validate(value);
					expect(value.hour).toBe(20);
					expect(value.minute).toBe(5);
					expect(value.second).toBe(0);
				});

				test.each(['08:05', '8:5', '20:05am', '8:5am'])('GIVEN %s THEN it resolves to 08:05', (time) => {
					const value = new DateParser(time, enUS);
					validate(value);
					expect(value.hour).toBe(8);
					expect(value.minute).toBe(5);
					expect(value.second).toBe(0);
				});
			});

			describe('seconds', () => {
				test.each(['20:05:02', '20:5:2', '20:05:02pm', '8:5:2pm'])('GIVEN %s THEN it resolves to 20:05:02', (time) => {
					const value = new DateParser(time, enUS);
					validate(value);
					expect(value.hour).toBe(20);
					expect(value.minute).toBe(5);
					expect(value.second).toBe(2);
				});

				test.each(['08:05:02', '8:5:2', '20:05:02am', '8:5:2am'])('GIVEN %s THEN it resolves to 08:05:02', (time) => {
					const value = new DateParser(time, enUS);
					validate(value);
					expect(value.hour).toBe(8);
					expect(value.minute).toBe(5);
					expect(value.second).toBe(2);
				});
			});
		});

		describe('datetime', () => {
			test.each([
				['YYYY/MM/DD and time', '2023/03/10 8pm', enUS],
				['MM/DD/YYYY and time with en-US locale', '03/10/2023 8pm', enUS],
				['DD/MM/YYYY and time with en-GB locale', '10/03/2023 8pm', enGB],
				['time and YYYY/MM/DD', '8pm 2023/03/10', enUS],
				['time and MM/DD/YYYY with en-US locale', '8pm 03/10/2023', enUS],
				['time and DD/MM/YYYY with en-GB locale', '8pm 10/03/2023', enGB]
			])('GIVEN %s THEN resolves to the correct datetime', (_description, input, locale) => {
				const value = new DateParser(input, locale);
				expect(value.year).toBe(2023);
				expect(value.month).toBe(3);
				expect(value.day).toBe(10);
				expect(value.hour).toBe(20);
				expect(value.minute).toBe(0);
				expect(value.second).toBe(0);
				expect(value.valid).toBe(true);
			});
		});
	});

	describe('normalize', () => {
		beforeAll(() => {
			vi.useFakeTimers({ now: new Date('2023-03-10T14:30:15.000Z') });
		});

		afterAll(() => {
			vi.useRealTimers();
		});

		function parse(input: string) {
			return new DateParser(input, enGB).normalize('Etc/UTC');
		}

		function expectEqualDuration(actual: Duration, expected: DurationLikeObject) {
			expect(actual.as('seconds')).toBe(Duration.fromObject(expected).as('seconds'));
		}

		describe('seconds', () => {
			test('GIVEN next second THEN returns next second', () => {
				const value = parse('14:30:16');
				expectEqualDuration(value, { seconds: 1 });
			});

			test('GIVEN previous second THEN returns next day minus one second', () => {
				const value = parse('14:30:14');
				expectEqualDuration(value, { days: 1, seconds: -1 });
			});
		});

		describe('minutes', () => {
			test('GIVEN next minute THEN returns next minute', () => {
				const value = parse('14:31:15');
				expectEqualDuration(value, { minutes: 1 });
			});

			test('GIVEN previous minute THEN returns next day minus one minute', () => {
				const value = parse('14:29:15');
				expectEqualDuration(value, { days: 1, minutes: -1 });
			});
		});

		describe('hours', () => {
			test('GIVEN next hour THEN returns next hour', () => {
				const value = parse('15:30:15');
				expectEqualDuration(value, { hours: 1 });
			});

			test('GIVEN previous hour THEN returns next day minus one hour', () => {
				const value = parse('13:30:15');
				expectEqualDuration(value, { days: 1, hours: -1 });
			});
		});

		describe('days', () => {
			test('GIVEN next day THEN returns next day', () => {
				const value = parse('11-03 14:30:15');
				expectEqualDuration(value, { days: 1 });
			});

			test('GIVEN previous day THEN returns next year minus one day', () => {
				const value = parse('09-03 14:30:15');
				expectEqualDuration(value, { years: 1, days: -1 });
			});

			test('GIVEN next day with no hour THEN returns next day at 00:00', () => {
				const value = parse('11-03');
				expectEqualDuration(value, { hours: 9, minutes: 29, seconds: 45 });
			});

			test('GIVEN previous day with no hour THEN returns next year minus one day at 00:00', () => {
				const value = parse('09-03');
				expectEqualDuration(value, { years: 1, days: -1, hours: -14, minutes: -30, seconds: -15 });
			});
		});

		describe('months', () => {
			// The following hardcoded days are due to day differences — a month has "30" days.
			test('GIVEN next month THEN returns next month', () => {
				const value = parse('10-04 14:30:15');
				expectEqualDuration(value, { months: 1, days: 1 });
			});

			test('GIVEN previous month THEN returns next year minus one month', () => {
				const value = parse('10-02 14:30:15');
				expectEqualDuration(value, { years: 1, months: -1, days: 2 });
			});
		});

		describe('years', () => {
			test('GIVEN previous year THEN returns previous year', () => {
				const value = parse('10-03-2022 14:30:15');
				expectEqualDuration(value, { years: -1 });
			});

			test('GIVEN current year THEN returns no difference', () => {
				const value = parse('10-03-2023 14:30:15');
				expectEqualDuration(value, {});
			});

			test('GIVEN next year THEN returns next year', () => {
				const value = parse('10-03-2024 14:30:15');
				expectEqualDuration(value, { years: 1, days: 1 });
			});
		});
	});
});
