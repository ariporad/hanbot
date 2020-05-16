import Discord, { TextChannel } from 'discord.js';
import { panic, formatMessage } from '../helpers';

/**
 *
 */
export function sendWelcomeMessage(
	member: Discord.GuildMember | Discord.PartialGuildMember,
	channel: Discord.TextChannel | string,
) {
	const welcomeChannel =
		channel instanceof Discord.TextChannel
			? channel
			: (member.guild.channels.cache.find((ch) => ch.name === channel) as
					| TextChannel
					| undefined);

	if (!welcomeChannel) return;

	welcomeChannel.send(formatMessage(member.guild)`
Welcome to the Olin Class of 2024 Discord, ${member}!

This Discord serves as a place for the Olin Class of 2024 (and a few gappies in the Class of 2025) to hang out, have fun, and get to know each other.

Feel free to talk about whatever here in ${'#general'}, post a picture of your pet in ${'#pet-pics'}}, or join our book club in ${'#book-club'}.

Make sure to share your Instagram/Snapchat/whatever in ${'#social-media'}.

Most evenings from 10PM-2AM ET, we hang out and play games on Zoom. Find more info and the link in ${'zoom'} (and/or use the \`!zoom\` command).

Finally, please assign yourself roles (time zone, major, pronouns, etc.) by clicking on your name.

Wondering why everyone is named Han? Well, we have a cult (sometimes misspelled clit). Ask our glorious leader, ${'%Clit leader'}, for more details and for how to join!
`);
}

export default function welcomeCommand(args: string, message: Discord.Message) {
	sendWelcomeMessage(message.member || panic(), message.channel as TextChannel);
}
