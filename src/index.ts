import Discord, { TextChannel } from 'discord.js';
import { DISCORD_ADMITTED_ROLE, DISCORD_WELCOME_CHANNEL, DISCORD_TOKEN } from './config';
import COMMANDS, { CommandHandler } from './commands';
import { sendWelcomeMessage } from './commands/welcome';

const client = new Discord.Client();

client.once('ready', () => {
	console.log('Connected to Discord!');
});

client.on('message', async (message) => {
	try {
		if (process.env.NODE_ENV === 'development') console.log('Got Message:', message.content);
		if (!(message.channel instanceof TextChannel)) return;

		for (const [, command, args] of message.content.matchAll(
			/^[ \t]*!([a-zA-Z0-9_-]+)(|([ \t\S]+))$/gmsu,
		)) {
			const cmd = command.toLowerCase();
			if ({}.hasOwnProperty.call(COMMANDS, cmd) && typeof COMMANDS[cmd] === 'function') {
				// Typescript is failing to infer that COMMANDS[cmd] cannot be null here
				const response = await (COMMANDS[cmd] as CommandHandler)(args, message);
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

client.on('guildMemberAdd', (member) => {
	if (DISCORD_ADMITTED_ROLE) {
		const admittedRole = member.guild.roles.cache.find(
			(role) => role.name === DISCORD_ADMITTED_ROLE,
		);

		if (!admittedRole) return;

		member.roles.add(admittedRole);
	}

	if (DISCORD_WELCOME_CHANNEL) {
		sendWelcomeMessage(member, DISCORD_WELCOME_CHANNEL);
	}
});

client.login(DISCORD_TOKEN);
