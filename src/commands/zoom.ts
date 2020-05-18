import Discord from 'discord.js';
import { getZoomInfo } from '../zoom';

export async function zoomInfo(args: string, message: Discord.Message) {
	const {
		meetingInfo: { join_url },
		active,
		participants,
	} = await getZoomInfo();

	let participantsStr = participants > 0 ? participants.toString() : 'some';

	const statusMessage = active
		? `There are ${participantsStr} people on the Zoom call right now, so hop on!`
		: "There's nobody on Zoom right now. If you wanted, you could ping `@here` to see if anyone wants to talk. Then, just click the link to join the Zoom call.";

	return `
On Wednesdays, we play Jackbox on Zoom! (and on other days too.)

Most evenings, generally from 10-2 PM ET, we hang out on Zoom to talk and play games (most commonly, The Jackbox Party Pack).

Our standing Zoom meeting can be found here: ${join_url}

${statusMessage}`.trim();
}

export async function zoomStatus(args: string, message: Discord.Message) {
	const { active, participants } = await getZoomInfo();

	let participantsStr = participants > 0 ? participants.toString() : 'some';

	await message.reply(
		active
			? `there are ${participantsStr} people on Zoom right now! :partying_face:`
			: `Nobody is on Zoom right now :cry:`,
	);
}
