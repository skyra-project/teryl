import { DateParser } from '#lib/utilities/DateParser';
import type { LocaleString } from 'discord-api-types/v10';

describe('DateParser', () => {
	describe('invalid', () => {
		test('GIVEN empty string THEN returns invalid', () => {
			const value = new DateParser('', 'en-US');
			expect(value.year).toBeNull();
			expect(value.month).toBeNull();
			expect(value.day).toBeNull();
			expect(value.hour).toBeNull();
			expect(value.minute).toBeNull();
			expect(value.second).toBeNull();
			expect(value.valid).toBe(false);
		});

		test('GIVEN decimal clash THEN returns invalid', () => {
			const value = new DateParser('1.5w', 'en-US');
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
		])('GIVEN %s THEN it resolves to the correct date', (_format, date) => {
			validate(new DateParser(date, 'en-US'));
		});

		test.each([
			['MM/DD/YYYY', '03/10/2023'],
			['MM-DD-YYYY', '03-10-2023'],
			['MM.DD.YYYY', '03.10.2023'],
			['MM/DD/YY', '03/10/23'],
			['MM-DD-YY', '03-10-23'],
			['MM.DD.YY', '03.10.23']
		])('GIVEN %s with en-US THEN it resolves to the correct date', (_format, date) => {
			validate(new DateParser(date, 'en-US'));
		});

		test.each([
			['DD/MM/YYYY', '10/03/2023'],
			['DD-MM-YYYY', '10-03-2023'],
			['DD.MM.YYYY', '10.03.2023'],
			['DD/MM/YY', '10/03/23'],
			['DD-MM-YY', '10-03-23'],
			['DD.MM.YY', '10.03.23']
		])('GIVEN %s with en-GB THEN it resolves to the correct date', (_format, date) => {
			validate(new DateParser(date, 'en-GB'));
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
				const value = new DateParser(time, 'en-US');
				validate(value);
				expect(value.hour).toBe(20);
				expect(value.minute).toBe(0);
				expect(value.second).toBe(0);
			});

			test.each(['08:00', '8:00', '8', '8am', '20am'])('GIVEN %s THEN it resolves to 08:00', (time) => {
				const value = new DateParser(time, 'en-US');
				validate(value);
				expect(value.hour).toBe(8);
				expect(value.minute).toBe(0);
				expect(value.second).toBe(0);
			});
		});

		describe('minutes', () => {
			test.each(['20:05', '20:5', '20:05pm', '8:5pm'])('GIVEN %s THEN it resolves to 20:05', (time) => {
				const value = new DateParser(time, 'en-US');
				validate(value);
				expect(value.hour).toBe(20);
				expect(value.minute).toBe(5);
				expect(value.second).toBe(0);
			});

			test.each(['08:05', '8:5', '20:05am', '8:5am'])('GIVEN %s THEN it resolves to 08:05', (time) => {
				const value = new DateParser(time, 'en-US');
				validate(value);
				expect(value.hour).toBe(8);
				expect(value.minute).toBe(5);
				expect(value.second).toBe(0);
			});
		});

		describe('seconds', () => {
			test.each(['20:05:02', '20:5:2', '20:05:02pm', '8:5:2pm'])('GIVEN %s THEN it resolves to 20:05:02', (time) => {
				const value = new DateParser(time, 'en-US');
				validate(value);
				expect(value.hour).toBe(20);
				expect(value.minute).toBe(5);
				expect(value.second).toBe(2);
			});

			test.each(['08:05:02', '8:5:2', '20:05:02am', '8:5:2am'])('GIVEN %s THEN it resolves to 08:05:02', (time) => {
				const value = new DateParser(time, 'en-US');
				validate(value);
				expect(value.hour).toBe(8);
				expect(value.minute).toBe(5);
				expect(value.second).toBe(2);
			});
		});
	});

	describe('datetime', () => {
		test.each([
			['YYYY/MM/DD and time', '2023/03/10 8pm', 'en-US' as LocaleString],
			['MM/DD/YYYY and time with en-US locale', '03/10/2023 8pm', 'en-US' as LocaleString],
			['DD/MM/YYYY and time with en-GB locale', '10/03/2023 8pm', 'en-GB' as LocaleString]
		])('GIVEN %s THEN resolves to the correct datetime', (_format, input, locale) => {
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
