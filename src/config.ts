import { sign } from 'jsonwebtoken';

// We have to require this because Typescript can't handle it.
export const { version } = require('../package.json');

export const START_TIME = new Date();

export const getFormattedStartTime = (): string => {
	const uptime = Date.now() - START_TIME.getTime();

	const dateStr = START_TIME.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });

	const days = Math.round(uptime / 1000 / 60 / 60 / 24);
	const hours = Math.round((uptime / 1000 / 60 / 60) % 24);
	const minutes = Math.round((uptime / 1000 / 60) % 60);
	const seconds = Math.round((uptime / 1000) % 60);

	return `${dateStr} PT (${days}d, ${hours}h, ${minutes}m, ${seconds}s)`;
};

// A random number used to differentiate multiple instances running at the same time.
export const FAVORITE_NUMBER = Math.floor(Math.random() * 100);

function getEnvVar(name: string, errorMessage: string = ''): string {
	if (typeof process.env[name] === 'string' && process.env[name]) {
		return process.env[name] as string;
	}
	throw new Error(`Missing Environment Variable $${name}! ${errorMessage}`);
}

export const ZOOM_MEETING_ID = getEnvVar('ZOOM_MEETING_ID', 'Need a Zoom Meeting ID to Monitor!');

const ZOOM_API_KEY = getEnvVar('ZOOM_API_KEY', 'Need a Zoom JWT API Key!');

const ZOOM_API_SECRET = getEnvVar('ZOOM_API_SECRET', 'Need a Zoom API Secret Token!');

export const ZOOM_WEBHOOK_SECRET = process.env.ZOOM_WEBHOOK_SECRET || null;

if (!ZOOM_WEBHOOK_SECRET) {
	console.warn(
		'WARNING: $ZOOM_WEBHOOK_SECRET is not set. Zoom webhook messages will not be verified.',
	);
}

export const DISCORD_TOKEN = getEnvVar('DISCORD_TOKEN', 'Need a Discord Bot User Secret!');
export const DISCORD_ADMITTED_ROLE = process.env.DISCORD_ADMITTED_ROLE || null;
export const DISCORD_WELCOME_CHANNEL = process.env.DISCORD_WELCOME_CHANNEL || null;

if (!DISCORD_ADMITTED_ROLE) {
	console.warn('WARNING: $DISCORD_ADMITTED_ROLE is not set. No role will be added to new users.');
}

if (!DISCORD_WELCOME_CHANNEL) {
	console.warn(
		'WARNING: $DISCORD_WELCOME_CHANNEL is not set. No welcome message will be sent for new users.',
	);
}

export const getZoomToken = () =>
	sign({ iss: ZOOM_API_KEY, exp: new Date().getTime() + 5000 }, ZOOM_API_SECRET);
