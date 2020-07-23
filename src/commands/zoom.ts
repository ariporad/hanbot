import Discord from 'discord.js';
import { getZoomInfo, ZoomInfo } from '../zoom';

async function generateZoomStatus(zoomInfo?: ZoomInfo): Promise<string> {
	const { active, participants, hasSeenStart } = zoomInfo || (await getZoomInfo());

	const participantsNumberStr =
		participants.length === 1 ? participants[0].name : `these ${participants.length} people`;

	return !active
		? "There's nobody on Zoom right now. If you wanted, you could ping `@here` or `@Zoom Time` to see if anyone wants to talk. Then, just click the link to join the Zoom call."
		: !hasSeenStart || participants.length === 0
		? `There are some people on the Zoom call right now, so hop on! (If I told you who, I'd have to kill you.)`
		: `Come join ${participantsNumberStr} on Zoom!${
				participants.length < 2
					? ''
					: '\n' + participants.map(({ name }) => `\n\t- ${name}`)
		  }`;
}

export async function zoomInfo(args: string, message: Discord.Message) {
	const info = await getZoomInfo();

	return `
On Wednesdays, we play Jackbox on Zoom! (and on other days too.)

Most evenings (generally between 10PM and 5AM ET), we hang out on Zoom to talk and play games (most commonly, The Jackbox Party Pack).

Our standing Zoom meeting can be found here: ${info.meetingInfo.join_url}

${await generateZoomStatus(info)}

Want to get a ping whenever people are on Zoom? Give yourself the \`Zoom Time\` roll!`.trim();
}

export async function zoomStatus(args: string, message: Discord.Message) {
	await message.reply(await generateZoomStatus());
}
