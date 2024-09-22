import { BrandingColors } from '#lib/common/constants';
import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { EmbedBuilder } from '@discordjs/builders';
import { Collection } from '@discordjs/collection';
import { envIsDefined, envParseString } from '@skyra/env-utilities';
import { Command, RegisterCommand, type MakeArguments } from '@skyra/http-framework';
import { applyLocalizedBuilder, getSupportedLanguageT, resolveUserKey, type TFunction } from '@skyra/http-framework-i18n';
import { Json, isAbortError, safeTimedFetch, type FetchError } from '@skyra/safe-fetch';
import { ApplicationIntegrationType, InteractionContextType, MessageFlags, type LocaleString } from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.Price;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription)
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
		.addStringOption((builder) =>
			// T - SAFEMOON
			applyLocalizedBuilder(builder, Root.OptionsFrom).setMinLength(1).setMaxLength(8).setRequired(true)
		)
		.addStringOption((builder) => applyLocalizedBuilder(builder, Root.OptionsTo).setMinLength(3).setMaxLength(500).setRequired(true))
		.addNumberOption((builder) => applyLocalizedBuilder(builder, Root.OptionsAmount).setMinValue(0))
)
export class UserCommand extends Command {
	public constructor(context: Command.LoaderContext) {
		super(context, { enabled: UserCommand.Authorization !== null });
	}

	public override async chatInputRun(interaction: Command.ChatInputInteraction, args: Options) {
		const from = args.from.toUpperCase();
		const result = await this.fetch(from, args.to.split(/[, ]+/g));
		return result.match({
			err: (error) => this.handleFetchError(interaction, error),
			ok: (result) => this.handleFetchOk(interaction, result, args.amount ?? 1, from)
		});
	}

	private fetch(from: string, to: readonly string[]) {
		const url = new URL('https://min-api.cryptocompare.com/data/price');
		url.searchParams.append('fsym', from.toUpperCase());
		url.searchParams.append('tsyms', to.join(',').toUpperCase());
		url.searchParams.append('extraParams', UserCommand.ExtraParams);

		return Json<CryptoCompareResult>(safeTimedFetch(url, 2000, { headers: { authorization: UserCommand.Authorization! } }));
	}

	private handleFetchError(interaction: Command.ChatInputInteraction, error: FetchError) {
		const key = isAbortError(error) ? Root.AbortError : (this.container.logger.error(error), Root.UnknownServerError);
		return interaction.reply({ content: resolveUserKey(interaction, key), flags: MessageFlags.Ephemeral });
	}

	private handleFetchOk(interaction: Command.ChatInputInteraction, result: CryptoCompareResult, amount: number, from: string) {
		if (result.Response === 'Error') {
			const content = resolveUserKey(interaction, Root.Error);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const t = getSupportedLanguageT(interaction);
		const amounts = [] as string[];
		for (const [currency, value] of Object.entries(result)) {
			amounts.push(this.format(t, currency, value * amount));
		}

		const embed = new EmbedBuilder() //
			.setColor(BrandingColors.Primary)
			.setDescription(t(Root.Result, { from: this.format(t, from, amount), amounts }))
			.setTimestamp();
		return interaction.reply({ embeds: [embed.toJSON()] });
	}

	/**
	 * Intl.NumberFormat's currency format only accepts currencies that are 3 characters long. For anything shorter
	 * (e.g. "T") or longer (e.g. "SAFEMOON"), we will fallback to the less pretty format of using a very similar
	 * regular number with the currency concatenated manually depending on where the locale places the currency at.
	 */
	private format(t: TFunction, currency: string, value: number) {
		if (currency.length === 3) {
			return t(LanguageKeys.Common.Currency, { value, formatParams: { value: { currency } } });
		}

		const formatter = UserCommand.CurrencyFallbackNumberFormat.ensure(
			t.lng as LocaleString,
			(locale) => new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
		);
		const amount = formatter.format(value);
		return UserCommand.LeftHandCurrencyLocales.has(t.lng as LocaleString) ? `${currency} ${amount}` : `${amount} ${currency}`;
	}

	private static readonly ExtraParams = `${envParseString('CLIENT_NAME')} ${envParseString('CLIENT_VERSION')} Discord Bot`;
	private static readonly Authorization = envIsDefined('CRYPTOCOMPARE_TOKEN') ? `Apikey ${envParseString('CRYPTOCOMPARE_TOKEN')}` : null;
	/**
	 * The locales that format as "currency amount", e.g. "BTC 300", rather than "amount currency", e.g. "300 BTC".
	 */
	private static readonly LeftHandCurrencyLocales = new Set<LocaleString>([
		'en-GB',
		'en-US',
		'hi',
		'id',
		'ja',
		'ko',
		'nl',
		'no',
		'pt-BR',
		'th',
		'tr',
		'zh-CN',
		'zh-TW'
	]);

	// "{{value, number(minimumFractionDigits:2, maximumFractionDigits:2)}}" from i18next yields different results
	// compared to using raw Intl.NumberFormat, so we will use this instead.
	private static readonly CurrencyFallbackNumberFormat = new Collection<LocaleString, Intl.NumberFormat>();
}

type Options = MakeArguments<{
	amount: 'number';
	from: 'string';
	to: 'string';
}>;

interface CryptoCompareResultOk extends Record<string, number> {}

interface CryptoCompareResultError {
	Response: 'Error';
	Message: string;
	HasWarning: boolean;
	Type: number;
	RateLimit: object;
	Data: object;
	ParamWithError: string;
}

type CryptoCompareResult = CryptoCompareResultOk | CryptoCompareResultError;
