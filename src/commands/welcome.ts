import Discord, { TextChannel } from 'discord.js';
import { panic, formatMessage } from '../helpers';

/**
 *
 */
export function sendWelcomeMessage(
	guild: Discord.Guild,
	member: Discord.GuildMember | Discord.PartialGuildMember | null,
	channel: Discord.TextChannel | string,
) {
	const welcomeChannel =
		channel instanceof Discord.TextChannel
			? channel
			: (guild.channels.cache.find((ch) => ch.name === channel) as TextChannel | undefined);

	if (!welcomeChannel) return;

	// prettier-ignore
	welcomeChannel.send(formatMessage(guild)`
Welcome to the Olin Class of 2024 Discord${member ? `, ${member}` : ''}! Please see ${'#server-info'} for some details about how our server works!`
	);
}

export default function welcomeCommand(args: string, message: Discord.Message) {
	if (!message.guild) return 'Sorry! This command must be run from within a server!';
	const target = message.mentions.members?.first() || message.member;
	sendWelcomeMessage(message.guild, target, message.channel as TextChannel);
}
