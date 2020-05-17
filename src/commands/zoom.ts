import Discord from 'discord.js';
import request from 'request-promise';
import { ZOOM_MEETING_ID, getZoomToken } from '../config';

/**
 * Check the status of the Zoom call.
 */
async function getZoomInfo() {
	const meetingInfo = await request.get({
		uri: `https://api.zoom.us/v2/meetings/${ZOOM_MEETING_ID}`,
		auth: {
			bearer: getZoomToken(),
		},
		headers: {
			'User-Agent': 'Hanbot',
			'Content-Type': 'application/json',
		},
		json: true,
	});

	console.log(JSON.stringify(meetingInfo, null, 2));

	return { meetingInfo, active: meetingInfo.status === 'started' };
}

export async function zoomInfo(args: string, message: Discord.Message) {
	const {
		meetingInfo: { join_url },
		active,
	} = await getZoomInfo();

	const statusMessage = active
		? 'There are people on the Zoom call right now, so hop on!'
		: "There's nobody on Zoom right now. If you wanted, you could ping `@here` to see if anyone wants to talk. Then, just click the link to join the Zoom call.";

	return `
On Wednesdays, we play Jackbox on Zoom! (and on other days too.)

Most evenings, generally from 10-2 PM ET, we hang out on Zoom to talk and play games (most commonly, The Jackbox Party Pack).

Our standing Zoom meeting can be found here: ${join_url}

${statusMessage}`.trim();
}

export async function zoomStatus(args: string, message: Discord.Message) {
	const { active } = await getZoomInfo();

	await message.reply(
		active ? `There are people on Zoom right now!` : `Nobody is on Zoom right now :cry:`,
	);
}
