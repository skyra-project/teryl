import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import {
	getColors,
	getData,
	getFile,
	getIcons,
	getWeatherName,
	resolveCurrentConditionsImperial,
	resolveCurrentConditionsSI,
	type ResolvedConditions
} from '#lib/utilities/weather';
import type { CurrentCondition, ValueWrapper, Weather } from '#lib/utilities/weather-types';
import type { RawFile } from '@discordjs/rest';
import { Command, RegisterCommand } from '@skyra/http-framework';
import {
	applyLocalizedBuilder,
	createSelectMenuChoiceName,
	getSupportedLanguageT,
	resolveUserKey,
	type TFunction,
	type TypedT
} from '@skyra/http-framework-i18n';
import { Canvas } from 'canvas-constructor/napi-rs';
import { MessageFlags, type LocaleString } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.Weather.RootName, LanguageKeys.Commands.Weather.RootDescription)
		.addStringOption((builder) =>
			applyLocalizedBuilder(builder, LanguageKeys.Commands.Weather.OptionsPlace).setMinLength(3).setMaxLength(85).setRequired(true)
		)
		.addStringOption((builder) =>
			applyLocalizedBuilder(builder, LanguageKeys.Commands.Weather.OptionsSystem).setChoices(
				createSelectMenuChoiceName(LanguageKeys.Commands.Weather.OptionsSystemMetric, { value: 'metric' }),
				createSelectMenuChoiceName(LanguageKeys.Commands.Weather.OptionsSystemSI, { value: 'si' }),
				createSelectMenuChoiceName(LanguageKeys.Commands.Weather.OptionsSystemImperial, { value: 'imperial' }),
				createSelectMenuChoiceName(LanguageKeys.Commands.Weather.OptionsSystemAuto, { value: 'auto' })
			)
		)
)
export class UserCommand extends Command {
	public override async chatInputRun(interaction: Command.ChatInputInteraction, args: Options) {
		const t = getSupportedLanguageT(interaction);
		const base = t.lng.length === 2 ? t.lng : t.lng.slice(0, 2);

		const result = await getData(args.place, base);
		return result.match({
			ok: (data) => this.handleOk(interaction, t, base, args, data),
			err: (key) => this.handleErr(interaction, key)
		});
	}

	private async handleOk(interaction: Command.ChatInputInteraction, t: TFunction, base: string, args: Options, data: Weather) {
		const useImperial = UserCommand.shouldUseImperial(t, args.system ?? 'auto');

		const [current] = data.current_condition;
		const resolved = useImperial
			? resolveCurrentConditionsImperial(current, t)
			: resolveCurrentConditionsSI(current, t, { kelvin: args.system === 'si' });
		const [nearestArea] = data.nearest_area;

		// Region can be an empty string, e.g. `Taumatawhakatangihangakoauauotamateaturipukakapikimaungahoronukupokaiwhenuakitanatahu`:
		const place = `${nearestArea.region[0].value || nearestArea.areaName[0].value}, ${nearestArea.country[0].value}`;
		const weatherDescription = UserCommand.getWeatherDescription(current, base);

		const response = await interaction.defer();
		const file = await UserCommand.draw(weatherDescription, place, current, resolved);
		return response.update({ files: [file] });
	}

	private handleErr(interaction: Command.ChatInputInteraction, key: TypedT) {
		const content = resolveUserKey(interaction, key);
		return interaction.reply({ content, flags: MessageFlags.Ephemeral });
	}

	// United States (en-US), Liberia (en-LR), and Myanmar (my-MM) are the only countries in the world that use Imperial:
	private static readonly ImperialLocales: readonly LocaleString[] = ['en-US'];
	private static Coordinates: Coordinates;

	private static shouldUseImperial(t: TFunction, system: 'metric' | 'si' | 'imperial' | 'auto') {
		switch (system) {
			case 'metric':
			case 'si':
				return false;
			case 'imperial':
				return true;
			case 'auto':
				return this.ImperialLocales.includes(t.lng as LocaleString);
		}
	}

	private static getWeatherDescription(conditions: CurrentCondition, base: string) {
		const translated = Reflect.get(conditions, `lang_${base}`) as ValueWrapper[] | undefined;
		return translated?.[0].value ?? conditions.weatherDesc[0].value;
	}

	private static async draw(weatherDescription: string, place: string, conditions: CurrentCondition, resolved: ResolvedConditions) {
		const weatherName = getWeatherName(conditions.weatherCode);
		const { background, text, theme } = getColors(weatherName);

		const [conditionImage, icons] = await Promise.all([getFile(weatherName), getIcons(theme)]);
		const { width, height, cardWidth, cardHeight, margin, columns, rows } = UserCommand.Coordinates;

		const imageSize = 128;
		const halfImageSize = imageSize / 2;

		const iconSize = 32;
		const halfIconSize = iconSize / 2;
		const iconMargin = iconSize + 10;

		const windDirectionRadians = (Number(conditions.winddirDegree) * Math.PI) / 180;

		const data = await new Canvas(width, height)
			.save()
			.setShadowColor('rgba(0,0,0,.7)')
			.setShadowBlur(margin)
			.setColor(background)
			.createRoundedPath(margin, margin, cardWidth, cardHeight, margin / 2)
			.fill()
			.restore()

			// Place Name
			.setTextFont('24px RobotoRegular')
			.setTextBaseline('middle')
			.setColor(text)
			.printResponsiveText(place, columns[0].left, rows[0].center, columns[2].right - columns[0].left)

			// Weather Icon
			.setTextFont('20px RobotoLight')
			.printImage(conditionImage, columns[0].center - halfImageSize, rows[2].center - halfImageSize)

			// Temperature
			.printImage(icons.temperature, columns[1].left, rows[2].center - halfIconSize)
			.printText(resolved.temperature, columns[1].left + iconMargin, rows[2].center)

			// Wind
			.save()
			.translate(columns[2].left + halfIconSize, rows[2].center)
			.rotate(windDirectionRadians + Math.PI)
			.printImage(icons.pointer, -halfIconSize, -halfIconSize)
			.restore()
			.printText(resolved.windSpeed, columns[2].left + iconMargin, rows[2].center)

			// Precipitation
			.printImage(icons.precipitation, columns[1].left, rows[3].center - halfIconSize)
			.printText(resolved.precipitation, columns[1].left + iconMargin, rows[3].center)

			// Visibility
			.printImage(icons.visibility, columns[2].left, rows[3].center - halfIconSize)
			.printText(resolved.visibility, columns[2].left + iconMargin, rows[3].center)

			// Weather Name
			.printResponsiveText(weatherDescription, columns[1].left, rows[1].center, columns[2].right - columns[1].left)

			.pngAsync();

		return { name: 'weather.png', data, contentType: 'image/png' } satisfies RawFile;
	}

	static {
		const width = 540;
		const height = 260;
		const margin = 15;

		const cardWidth = width - margin * 2;
		const cardHeight = height - margin * 2;

		const contentWidth = cardWidth - margin * 2;
		const contentHeight = cardHeight - margin * 2;

		const contentMargin = margin * 2;

		const amountColumns = 3;
		const amountRows = 4;

		const columnWidth = contentWidth / amountColumns;
		const rowHeight = contentHeight / amountRows;

		const columns: Column[] = [];
		for (let x = 0; x < amountColumns; ++x) {
			const left = Math.ceil(x * columnWidth) + contentMargin;
			const center = Math.round((x + 0.5) * columnWidth) + contentMargin;
			const right = Math.floor((x + 1) * columnWidth) + contentMargin;
			columns.push({ left, center, right });
		}

		const rows: Row[] = [];
		for (let y = 0; y < amountRows; ++y) {
			const top = Math.ceil(y * rowHeight) + contentMargin;
			const center = Math.round((y + 0.5) * rowHeight) + contentMargin;
			const bottom = Math.floor((y + 1) * rowHeight) + contentMargin;
			rows.push({ top, center, bottom });
		}

		this.Coordinates = { width, height, margin, cardWidth, cardHeight, contentWidth, contentHeight, columns, rows };
	}
}

interface Options {
	place: string;
	system?: 'metric' | 'si' | 'imperial' | 'auto';
}

interface Column {
	left: number;
	center: number;
	right: number;
}

interface Row {
	top: number;
	center: number;
	bottom: number;
}

interface Coordinates {
	width: number;
	height: number;
	margin: number;
	cardWidth: number;
	cardHeight: number;
	contentWidth: number;
	contentHeight: number;
	columns: Column[];
	rows: Row[];
}
