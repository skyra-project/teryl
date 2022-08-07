import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { bold, SlashCommandStringOption } from '@discordjs/builders';
import { Result } from '@sapphire/result';
import { Command, RegisterCommand } from '@skyra/http-framework';
import { applyLocalizedBuilder, TypedT } from '@skyra/http-framework-i18n';
import { RESTGetAPIChannelMessageResult, Routes } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, LanguageKeys.Commands.Poll.RootName, LanguageKeys.Commands.Poll.RootDescription) //
		.addStringOption((builder) => applyLocalizedBuilder(builder, LanguageKeys.Commands.Poll.OptionsTitle))
		.addStringOption(UserCommand.makeOption(LanguageKeys.Commands.Poll.OptionsFirstName))
		.addStringOption(UserCommand.makeOption(LanguageKeys.Commands.Poll.OptionsSecondName))
		.addStringOption(UserCommand.makeOption(LanguageKeys.Commands.Poll.OptionsThirdName).setRequired(false))
		.addStringOption(UserCommand.makeOption(LanguageKeys.Commands.Poll.OptionsFourthName).setRequired(false))
		.addStringOption(UserCommand.makeOption(LanguageKeys.Commands.Poll.OptionsFifthName).setRequired(false))
)
export class UserCommand extends Command {
	public override async *chatInputRun(interaction: Command.Interaction, options: Options): Command.AsyncGeneratorResponse {
		const set = new Set([options.first, options.second]);
		if (options.third) set.add(options.third);
		if (options.fourth) set.add(options.fourth);
		if (options.fifth) set.add(options.fifth);

		const choices = [...set];
		const content = `${bold(options.title)}\n${choices.map((choice, index) => `• ${UserCommand.NumberEmojis[index]} ${choice}`)}`;
		yield this.message({ content });

		const result = await Result.fromAsync(
			this.container.rest.get(Routes.webhookMessage(interaction.id, interaction.token)) as Promise<RESTGetAPIChannelMessageResult>
		);

		await result.match({
			ok: (message) => this.addReactions(message, set.size),
			err: (error) => this.container.logger.error(error)
		});

		return undefined;
	}

	private async addReactions(message: RESTGetAPIChannelMessageResult, amount: number) {
		for (let i = 0; i < amount; ++i) {
			const route = Routes.channelMessageOwnReaction(message.channel_id, message.id, UserCommand.EncodedEmojis[i]);
			const result = await Result.fromAsync(this.container.rest.get(route));
			if (result.isErr()) break;
		}
	}

	private static NumberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
	private static EncodedEmojis = UserCommand.NumberEmojis.map((emoji) => encodeURIComponent(emoji));

	private static makeOption(key: TypedT) {
		return applyLocalizedBuilder(new SlashCommandStringOption(), key, LanguageKeys.Commands.Poll.OptionsValueDescription);
	}
}

interface Options {
	title: string;
	first: string;
	second: string;
	third?: string;
	fourth?: string;
	fifth?: string;
}
