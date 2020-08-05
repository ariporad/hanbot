import Discord from 'discord.js';
import { getState } from '../store';
import { getIsActive, getHasSeenStart, getOnlineUsers, getJoinUrl } from '../store/zoom';

function generateZoomStatus(): string {
	const state = getState();
	const active = getIsActive(state);
	const hasSeenStart = getHasSeenStart(state);
	const onlineUsers = getOnlineUsers(state);

	const onlineUsersNumberStr =
		onlineUsers.length === 1 ? onlineUsers[0].name : `these ${onlineUsers.length} people`;

	return !active
		? "There's nobody on Zoom right now. If you wanted, you could ping `@here` or `@Zoom Time` to see if anyone wants to talk. Then, just click the link to join the Zoom call."
		: !hasSeenStart || onlineUsers.length === 0
		? `There are some people on the Zoom call right now, so hop on! (If I told you who, I'd have to kill you.)`
		: `Come join ${onlineUsersNumberStr} on Zoom!${
				onlineUsers.length < 2
					? ''
					: '\n' + onlineUsers.map(({ name }) => `\n\t- ${name}`).join('')
		  }`;
}

export function zoomInfo(args: string, message: Discord.Message) {
	const joinUrl = getJoinUrl(getState());

	return `
On Wednesdays, we play Jackbox on Zoom! (and on other days too.)

Most evenings (generally between 10PM and 5AM ET), we hang out on Zoom to talk and play games (most commonly, The Jackbox Party Pack).

Our standing Zoom meeting can be found here: ${joinUrl}

${generateZoomStatus()}

Want to get a ping whenever people are on Zoom? Give yourself the \`Zoom Time\` roll!`.trim();
}

export async function zoomStatus(args: string, message: Discord.Message) {
	const joinUrl = getJoinUrl(getState());
	await message.reply(`${generateZoomStatus()}\n\nLink: ${joinUrl}`);
}
