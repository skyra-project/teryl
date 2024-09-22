import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { bold, SlashCommandStringOption } from '@discordjs/builders';
import { Result } from '@sapphire/result';
import { Command, Message, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, type TypedT } from '@skyra/http-framework-i18n';
import { ApplicationIntegrationType, InteractionContextType, Routes } from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.Poll;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription) //
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
		.setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel)
		.addStringOption((builder) => applyLocalizedBuilder(builder, Root.OptionsTitle).setRequired(true))
		.addStringOption(UserCommand.makeOption(Root.OptionsFirstName).setRequired(true))
		.addStringOption(UserCommand.makeOption(Root.OptionsSecondName).setRequired(true))
		.addStringOption(UserCommand.makeOption(Root.OptionsThirdName))
		.addStringOption(UserCommand.makeOption(Root.OptionsFourthName))
		.addStringOption(UserCommand.makeOption(Root.OptionsFifthName))
)
export class UserCommand extends Command {
	public override async chatInputRun(interaction: Command.ChatInputInteraction, options: Options) {
		const set = new Set([options.first, options.second]);
		if (options.third) set.add(options.third);
		if (options.fourth) set.add(options.fourth);
		if (options.fifth) set.add(options.fifth);

		const choices = [...set];
		const content = `${bold(options.title)}\n${choices.map((choice, index) => `• ${NumberEmojis[index]} ${choice}`).join('\n')}`;

		const result = await (await interaction.reply({ content })).get();
		await result.match({
			ok: (message) => this.addReactions(message, set.size),
			err: (error) => this.container.logger.error(error)
		});

		return undefined;
	}

	private async addReactions(message: Message, amount: number) {
		for (let i = 0; i < amount; ++i) {
			const route = Routes.channelMessageOwnReaction(message.channelId, message.id, EncodedEmojis[i]);
			const result = await Result.fromAsync(this.container.rest.put(route));
			if (result.isErr()) break;
		}
	}

	private static makeOption(key: TypedT) {
		return applyLocalizedBuilder(new SlashCommandStringOption(), key, Root.OptionsValueDescription);
	}
}

const NumberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'] as const;
const EncodedEmojis = NumberEmojis.map((emoji) => encodeURIComponent(emoji));

interface Options {
	title: string;
	first: string;
	second: string;
	third?: string;
	fourth?: string;
	fifth?: string;
}
