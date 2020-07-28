import { version, START_TIME, FAVORITE_NUMBER, ZOOM_MEETING_ID } from '../config';
import { getZoomInfo } from '../zoom';
import { hostname } from 'os';
import { Message } from 'discord.js';
import { formatMessage, panic, formatUptime } from '../helpers';

export async function getDebugInfo(): Promise<string> {
	const { active, participants, hasSeenStart } = await getZoomInfo();

	return [
		'Hanbot OK\n',
		...([
			['Version', version],
			['Environment', process.env.NODE_ENV || 'unknown (defaults to development)'],
			['Favorite Number', FAVORITE_NUMBER],
			['Running Since', formatUptime(START_TIME)],
			['Hostname', hostname()],
			['Ultimate Answer', '42'],
			'',
			['Zoom Meeting ID', ZOOM_MEETING_ID],
			['Zoom Active?', active],
			['Zoom Seen Start?', hasSeenStart],
			active && [
				'Zoom Participants',
				participants.map(({ name, id }) => `\n\t- ${name} (${id})`).join(''),
			],
			process.env.HEROKU_SLUG_COMMIT && ['\nGit Commit ID', process.env.HEROKU_SLUG_COMMIT],
			'',
			process.env.HEROKU_APP_ID && ['Heroku App ID', process.env.HEROKU_APP_ID],
			process.env.HEROKU_APP_NAME && ['Heroku App Name', process.env.HEROKU_APP_NAME],
			process.env.HEROKU_DYNO_ID && ['Heroku Dyno ID', process.env.HEROKU_DYNO_ID],
			process.env.HEROKU_RELEASE_CREATED_AT && [
				'Heroku Release Created At',
				formatUptime(new Date(process.env.HEROKU_RELEASE_CREATED_AT)),
			],
			process.env.HEROKU_RELEASE_VERSION && [
				'Heroku Release Version',
				process.env.HEROKU_RELEASE_VERSION,
			],
			process.env.HEROKU_SLUG_DESCRIPTION && [
				'Heroku Slug Description',
				process.env.HEROKU_DYNO_ID,
			],
			'',
			[
				'This Message Generated At',
				new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) + ' PT',
			],
		] as (string | [string, string])[])
			// Ignore falsey values to enable x && [...]
			.filter((x) => typeof x === 'string' || Array.isArray(x))
			.map((x) => (typeof x === 'string' ? x : `${x[0]}: ${x[1]}`)),
	].join('\n');
}

export async function debugInfo(args: string, message: Message) {
	await message.channel.send(await getDebugInfo());
}
