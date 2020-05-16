import Discord, { Message } from 'discord.js';
import { sign } from 'jsonwebtoken';
import request from 'request-promise';

function getEnvVar(name: string, errorMessage: string = ''): string {
	if (typeof process.env[name] === 'string' && process.env[name]) {
		return process.env[name] as string;
	}
	throw new Error(`Missing Environment Variable $${name}! ${errorMessage}`);
}

const DISCORD_TOKEN = getEnvVar('DISCORD_TOKEN', 'Need a Discord Bot User Secret!');

const ZOOM_MEETING_ID = getEnvVar('ZOOM_MEETING_ID', 'Need a Zoom Meeting ID to Monitor!');
const ZOOM_API_KEY = getEnvVar('ZOOM_API_KEY', 'Need a Zoom JWT API Key!');
const ZOOM_API_SECRET = getEnvVar('ZOOM_API_SECRET', 'Need a Zoom API Secret Token!');

const getZoomToken = () =>
	sign({ iss: ZOOM_API_KEY, exp: new Date().getTime() + 5000 }, ZOOM_API_SECRET);

const client = new Discord.Client();

client.once('ready', () => {
	console.log('Connected to Discord!');
});

type CommandHandler = (message: Discord.Message) => void | string | Promise<void | string>;

const COMMANDS: { [command: string]: null | CommandHandler } = {
	// Prevents commands from bubbling up the prototype chain
	__proto__: null,

	ping(message) {
		return 'pong!';
	},

	async zoom(message) {
		const { status, join_url } = await request.get({
			uri: 'https://api.zoom.us/v2/meetings/' + ZOOM_MEETING_ID,
			auth: {
				bearer: getZoomToken(),
			},
			headers: {
				'User-Agent': 'Hanbot',
				'Content-Type': 'application/json',
			},
			json: true,
		});

		return `
On Wednesdays, we play Jackbox on Zoom! (and on other days too.)

Most evenings, generally from 10-2 PM ET, we hang out on Zoom to talk and play games (most commonly, The Jackbox Party Pack).

Our standing Zoom meeting can be found here: ${join_url}

${
	status === 'started'
		? 'There are people on the Zoom call right now, so hop on!'
		: "There's nobody on Zoom right now. If you wanted, you could ping `@here` to see if anyone wants to talk. Then, just click the link to join the Zoom call."
}
`.trim();
	},
};

client.on('message', async (message) => {
	try {
		console.log('Got Message:', message.content);

		for (const [, command, args] of message.content.matchAll(
			/^[ \t]*!([a-zA-Z0-9_-]+)(|([ \t\S]+))$/gmsu,
		)) {
			const cmd = command.toLowerCase();
			if ({}.hasOwnProperty.call(COMMANDS, cmd) && typeof COMMANDS[cmd] === 'function') {
				// Typescript is failing to infer that COMMANDS[cmd] cannot be null here
				const response = await (COMMANDS[cmd] as CommandHandler)(message);
				if (typeof response === 'string') {
					await message.channel.send(response);
				}
			}
		}
	} catch (err) {
		console.error('ERROR!');
		console.error(`Message: ${message.content}`, message);
		console.error(`Error: ${err.message}`);
		console.error(err);
	}
});

client.login(DISCORD_TOKEN);
