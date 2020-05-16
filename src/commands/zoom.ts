import Discord from 'discord.js';
import request from 'request-promise';
import { ZOOM_MEETING_ID, getZoomToken } from '../config';

/**
 * Check the status of the Zoom call.
 */
export default async function zoom(args: string, message: Discord.Message) {
	const { status, join_url } = await request.get({
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

	const meetingStatus =
		status === 'started'
			? 'There are people on the Zoom call right now, so hop on!'
			: "There's nobody on Zoom right now. If you wanted, you could ping `@here` to see if anyone wants to talk. Then, just click the link to join the Zoom call.";

	return `
On Wednesdays, we play Jackbox on Zoom! (and on other days too.)

Most evenings, generally from 10-2 PM ET, we hang out on Zoom to talk and play games (most commonly, The Jackbox Party Pack).

Our standing Zoom meeting can be found here: ${join_url}

${meetingStatus}`.trim();
}
