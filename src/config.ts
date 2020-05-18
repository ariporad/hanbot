import { sign } from 'jsonwebtoken';

// We have to require this because Typescript can't handle it.
export const { version } = require('../package.json');

export const START_TIME = new Date();

function getEnvVar(name: string, errorMessage: string = ''): string {
	if (typeof process.env[name] === 'string' && process.env[name]) {
		return process.env[name] as string;
	}
	throw new Error(`Missing Environment Variable $${name}! ${errorMessage}`);
}

export const ZOOM_MEETING_ID = getEnvVar('ZOOM_MEETING_ID', 'Need a Zoom Meeting ID to Monitor!');

const ZOOM_API_KEY = getEnvVar('ZOOM_API_KEY', 'Need a Zoom JWT API Key!');
const ZOOM_API_SECRET = getEnvVar('ZOOM_API_SECRET', 'Need a Zoom API Secret Token!');

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
