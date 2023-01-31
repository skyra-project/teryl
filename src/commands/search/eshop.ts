import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { AlgoliaEndpoint, BaseHit, get, search } from '#lib/utilities/algolia';
import { bold, EmbedBuilder, time, TimestampStyles } from '@discordjs/builders';
import { cutText, isNullish, isNullishOrEmpty, toTitleCase } from '@sapphire/utilities';
import { envIsDefined } from '@skyra/env-utilities';
import { AutocompleteInteractionArguments, Command, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, resolveUserKey } from '@skyra/http-framework-i18n';
import { MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.Eshop.RootName, LanguageKeys.Commands.Eshop.RootDescription).addStringOption((builder) =>
		applyLocalizedBuilder(builder, LanguageKeys.Commands.Eshop.OptionsInput).setAutocomplete(true).setMaxLength(100).setRequired(true)
	)
)
export class UserCommand extends Command {
	public constructor(context: Command.Context) {
		super(context, { enabled: envIsDefined('NINTENDO_ID', 'NINTENDO_TOKEN') });
	}

	public override async autocompleteRun(interaction: Command.AutocompleteInteraction, options: AutocompleteInteractionArguments<Options>) {
		const result = await search(UserCommand.Endpoint, options.input);
		return interaction.reply({ choices: result.unwrapOr([]).map((entry) => ({ name: UserCommand.getHitName(entry), value: entry.title })) });
	}

	public override async chatInputRun(interaction: Command.ChatInputInteraction, options: Options) {
		// TODO: Implement i18n
		// TODO(favna): Implement second EShop source
		const data = await get(UserCommand.Endpoint, options.input);
		if (data.isErr()) {
			const content = resolveUserKey(interaction, LanguageKeys.Commands.Eshop.NoResults);
			return interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}

		const hit = data.unwrap();
		const price = isNullish(hit.msrp) ? 'TBD' : hit.msrp > 0 ? `${hit.msrp} USD` : 'Free';
		const releaseDate = isNullishOrEmpty(hit.releaseDateDisplay)
			? hit.releaseDateDisplay
			: time(new Date(hit.releaseDateDisplay), TimestampStyles.ShortDate);
		const numberOfPlayers = isNullishOrEmpty(hit.numOfPlayers) ? 'Unknown' : toTitleCase(hit.numOfPlayers);
		const esrb = isNullishOrEmpty(hit.esrbRating)
			? 'No ESRB rating'
			: [bold(hit.esrbRating), isNullishOrEmpty(hit.esrbDescriptors) ? '' : ` - ${hit.esrbDescriptors.join(', ')}`].join('');

		const embed = new EmbedBuilder()
			.setTitle(hit.title)
			.setURL(`https://nintendo.com${hit.url}`)
			.setThumbnail(hit.boxart ?? hit.horizontalHeaderImage ?? null)
			.setDescription(cutText(hit.description, 750))
			.addFields(
				{ name: 'Price', value: price, inline: true },
				{ name: 'Availability', value: hit.availability.join(', '), inline: true },
				{ name: 'Release Date', value: releaseDate, inline: true },
				{ name: 'Number of Players', value: numberOfPlayers, inline: true },
				{ name: 'Platform', value: hit.platform, inline: true },
				{ name: 'Genres', value: isNullishOrEmpty(hit.genres) ? 'None' : hit.genres.join(', '), inline: true },
				{ name: 'ESRB', value: esrb }
			);
		return interaction.reply({ embeds: [embed.toJSON()] });
	}

	private static Endpoint: AlgoliaEndpoint<EshopHit> = {
		url: `https://${process.env.NINTENDO_ID}-dsn.algolia.net/1/indexes/ncom_game_en_us/query`,
		apiKey: process.env.NINTENDO_TOKEN,
		applicationId: process.env.NINTENDO_ID,
		prefix: 'eshop',
		keyCallback: (hit) => hit.title
	};

	private static getHitName(hit: EshopHit) {
		return `${hit.title} (${hit.releaseDateDisplay.slice(0, 4)})`;
	}
}

interface Options {
	input: string;
}

interface EshopHit extends BaseHit {
	title: string;
	description: string;
	url: string;
	nsuid: string;
	slug: string;
	boxart: string;
	horizontalHeaderImage: string;
	platform: string;
	releaseDateDisplay: string;
	esrbRating: string;
	numOfPlayers: string;
	featured: boolean;
	freeToStart: boolean;
	esrbDescriptors: string[];
	franchises: string[];
	genres: string[];
	publishers: string[];
	developers: string[];
	generalFilters: string[];
	howToShop: string[];
	playerFilters: string[];
	priceRange: string;
	msrp: number;
	salePrice: null;
	lowestPrice: number;
	availability: string[];
}
