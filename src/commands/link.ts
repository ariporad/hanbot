import Discord from 'discord.js';
import { dispatch, getState } from '../store';
import { linkUser } from '../store/zoom';
import { getUserByName } from '../store/zoom';
import { formatMessage, panic } from '../helpers';

export default function link(args: string, message: Discord.Message) {
	const name = args.trim();
	const state = getState();
	const user = getUserByName(name)(state);
	if (user) {
		if (user.temporary) {
			return formatMessage(message.guild || panic())`
${message.author} You joined the zoom without signing in. Sign in to Zoom and rejoin, then link your accounts.
Sign in to your Olin Zoom account here: https://olin.zoom.us
`;
		}
		dispatch(linkUser({ discordId: message.author.id, zoomId: user.zoomId }));
		return formatMessage(
			message.guild || panic(),
		)`${message.author} I'll know who you are when I see **${name}** on Zoom.`;
	} else {
		return `I've never met anyone called **${name}** on Zoom. Try joining the Zoom and linking again.`;
	}
}
