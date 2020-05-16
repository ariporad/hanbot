import Discord, { Message, TextChannel } from 'discord.js';
import { sign } from 'jsonwebtoken';
import request from 'request-promise';

function getEnvVar(name: string, errorMessage: string = ''): string {
	if (typeof process.env[name] === 'string' && process.env[name]) {
		return process.env[name] as string;
	}
	throw new Error(`Missing Environment Variable $${name}! ${errorMessage}`);
}

const DISCORD_TOKEN = getEnvVar('DISCORD_TOKEN', 'Need a Discord Bot User Secret!');
const DISCORD_ADMITTED_ROLE = process.env.DISCORD_ADMITTED_ROLE || null;
const DISCORD_WELCOME_CHANNEL = process.env.DISCORD_WELCOME_CHANNE || null;

const ZOOM_MEETING_ID = getEnvVar('ZOOM_MEETING_ID', 'Need a Zoom Meeting ID to Monitor!');
const ZOOM_API_KEY = getEnvVar('ZOOM_API_KEY', 'Need a Zoom JWT API Key!');
const ZOOM_API_SECRET = getEnvVar('ZOOM_API_SECRET', 'Need a Zoom API Secret Token!');

const getZoomToken = () =>
	sign({ iss: ZOOM_API_KEY, exp: new Date().getTime() + 5000 }, ZOOM_API_SECRET);

const client = new Discord.Client();

type CommandHandler = (message: Discord.Message) => void | string | Promise<void | string>;

function panic(message?: string): never {
	throw new Error(message);
}

function welcome(member: Discord.GuildMember | Discord.PartialGuildMember, channelName: string) {
	const welcomeChannel = member.guild.channels.cache.find((ch) => ch.name === channelName) as
		| TextChannel
		| undefined;

	if (!welcomeChannel) return;

	const clitLeader =
		member.guild.roles.cache.find((role) => role.name.toLowerCase() === 'clit leader') || 'Han';

	welcomeChannel.send(
		`
Welcome to the Olin Class of 2024 Discord, ${member}!

This Discord serves as a place for the Olin Class of 2024 (and a few gappies in the Class of 2025) to hang out, have fun, and get to know each other.

Feel free to talk about whatever here in ${findChannel(
			member.guild,
			'general',
		)}, post a picture of your pet in ${findChannel(
			member.guild,
			'pet-pics',
		)}, or join our book club in ${findChannel(member.guild, 'book-club')}.

Make sure to share your Instagram/Snapchat/whatever in ${findChannel(member.guild, 'social-media')}.

Most evenings from 10PM-2AM ET, we hang out and play games on Zoom. Find more info and the link in ${findChannel(
			member.guild,
			'zoom',
		)} (and/or use the \`!zoom\` command).

Finally, please assign yourself roles (time zone, major, pronouns, etc.) by clicking on your name.

Wondering why everyone is named Han? Well, we have a cult (sometimes misspelled clit). Ask our glorious leader, ${clitLeader}, for more details and for how to join!
`.trim(),
	);
}

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

	welcome(message) {
		welcome(message.member || panic(), 'bot-testing');
	},
};

client.on('message', async (message) => {
	try {
		if (process.env.NODE_ENV === 'development') console.log('Got Message:', message.content);

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

client.once('ready', () => {
	console.log('Connected to Discord!');
});

const findChannel = (guild: Discord.Guild, name: string) =>
	guild.channels.cache.find((guild) => guild.name === name);

client.on('guildMemberAdd', (member) => {
	if (DISCORD_ADMITTED_ROLE) {
		const admittedRole = member.guild.roles.cache.find(
			(role) => role.name === DISCORD_ADMITTED_ROLE,
		);

		if (!admittedRole) return;

		member.roles.add(admittedRole);
	}

	if (DISCORD_WELCOME_CHANNEL) {
		welcome(member, DISCORD_WELCOME_CHANNEL);
	}
});

client.login(DISCORD_TOKEN);
