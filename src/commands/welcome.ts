import Discord, { TextChannel } from 'discord.js';
import { panic, findChannel } from '../helpers';

export function sendWelcomeMessage(
	member: Discord.GuildMember | Discord.PartialGuildMember,
	channelName: string,
) {
	const welcomeChannel = member.guild.channels.cache.find((ch) => ch.name === channelName) as
		| TextChannel
		| undefined;

	if (!welcomeChannel) return;

	const clitLeader =
		member.guild.roles.cache.find((role) => role.name.toLowerCase() === 'clit leader') || 'Han';

	welcomeChannel.send(
		`
Welcome to the Olin Class of 2024 Discord, ${member}!

This Discord serves as a place for the Olin Class of 2024 (and a few gappies in the Class of 2025) to hang out, have fun, and get to know each other.

Feel free to talk about whatever here in ${findChannel(
			member.guild,
			'general',
		)}, post a picture of your pet in ${findChannel(
			member.guild,
			'pet-pics',
		)}, or join our book club in ${findChannel(member.guild, 'book-club')}.

Make sure to share your Instagram/Snapchat/whatever in ${findChannel(member.guild, 'social-media')}.

Most evenings from 10PM-2AM ET, we hang out and play games on Zoom. Find more info and the link in ${findChannel(
			member.guild,
			'zoom',
		)} (and/or use the \`!zoom\` command).

Finally, please assign yourself roles (time zone, major, pronouns, etc.) by clicking on your name.

Wondering why everyone is named Han? Well, we have a cult (sometimes misspelled clit). Ask our glorious leader, ${clitLeader}, for more details and for how to join!
`.trim(),
	);
}

export default function welcomeCommand(args: string, message: Discord.Message) {
	sendWelcomeMessage(message.member || panic(), 'bot-testing');
}
