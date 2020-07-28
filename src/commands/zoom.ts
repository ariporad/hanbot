import Discord from 'discord.js';
import { updateZoomStatus } from '../zoom';
import { getState } from '../store';
import { getCallIsActive, getHasSeenStart, getParticipants } from '../store/zoom';

async function generateZoomStatus(): Promise<string> {
	const state = getState();
	const active = getCallIsActive(state);
	const hasSeenStart = getHasSeenStart(state);
	const participants = getParticipants(state);

	const participantsNumberStr =
		participants.length === 1 ? participants[0] : `these ${participants.length} people`;

	return !active
		? "There's nobody on Zoom right now. If you wanted, you could ping `@here` or `@Zoom Time` to see if anyone wants to talk. Then, just click the link to join the Zoom call."
		: !hasSeenStart || participants.length === 0
		? `There are some people on the Zoom call right now, so hop on! (If I told you who, I'd have to kill you.)`
		: `Come join ${participantsNumberStr} on Zoom!${
				participants.length < 2
					? ''
					: '\n' + participants.map(({ name }) => `\n\t- ${name}`).join('')
		  }`;
}

export async function zoomInfo(args: string, message: Discord.Message) {
	const joinUrl = await updateZoomStatus();

	return `
On Wednesdays, we play Jackbox on Zoom! (and on other days too.)

Most evenings (generally between 10PM and 5AM ET), we hang out on Zoom to talk and play games (most commonly, The Jackbox Party Pack).

Our standing Zoom meeting can be found here: ${joinUrl}

${await generateZoomStatus()}

Want to get a ping whenever people are on Zoom? Give yourself the \`Zoom Time\` roll!`.trim();
}

export async function zoomStatus(args: string, message: Discord.Message) {
	const joinLink = await updateZoomStatus();
	await message.reply(`${await generateZoomStatus()}\n\nLink: ${joinLink}`);
}
