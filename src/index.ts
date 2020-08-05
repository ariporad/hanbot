import Discord, { TextChannel } from 'discord.js';
import {
	DISCORD_ADMITTED_ROLE,
	DISCORD_WELCOME_CHANNEL,
	DISCORD_TOKEN,
	PRODUCTION,
} from './config';
import COMMANDS, { CommandHandler } from './commands';
import { sendWelcomeMessage } from './commands/welcome';
import createApp from './webhooks';
import { createServer } from 'http';
import { registerDiscordStatusSubscriptions } from './discord';
import { updateZoomStatus } from './zoom';

const client = new Discord.Client();
const app = createApp();
const server = createServer(app);

server.listen(process.env.PORT || 8080, () => {
	const { address, port } = server.address() as any;
	console.log(`Webhook Server listening on http://${address}:${port}`);
});

client.once('ready', async () => {
	console.log(
		'Connected to Discord! Client ID:',
		client.user?.id,
		'Username:',
		client.user?.username,
	);

	await updateZoomStatus();
	// keep the discord status in sync
	registerDiscordStatusSubscriptions(client);
});

client.on('message', async (message) => {
	try {
		if (!PRODUCTION) console.log('Got Message:', message.content);
		if (!(message.channel instanceof TextChannel)) return;

		for (const [, command, args] of message.content.matchAll(
			// Parse both !command and @Hanbot command
			// XXX: Should we use proper mention parsing instead of this regex?
			new RegExp(
				`^[ \\t]*(?:!|<@!?${client.user?.id}>[ \\t]*!?)([a-zA-Z0-9_-]+)(|([ \\t\\S]+))$`,
				'gmsu',
			),
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
	console.log(`New Member! ${member.displayName} (${member.id})`);

	if (DISCORD_ADMITTED_ROLE) {
		console.log(`====> Giving new member role: ${DISCORD_ADMITTED_ROLE}`);
		const admittedRole = member.guild.roles.cache.find(
			(role) => role.name === DISCORD_ADMITTED_ROLE,
		);

		if (!admittedRole) {
			console.error(`====> ERROR! Couldn't find admitted role: ${DISCORD_ADMITTED_ROLE}`);
			return;
		}

		member.roles.add(admittedRole);
	} else {
		console.log(`====> DISCORD_ADMITTED_ROLE not set, not assigning role`);
	}

	if (DISCORD_WELCOME_CHANNEL) {
		console.log(
			`====> Sending welcome message to ${member.displayName} in #${DISCORD_WELCOME_CHANNEL}`,
		);
		sendWelcomeMessage(member.guild, member, DISCORD_WELCOME_CHANNEL);
	} else {
		console.log(`====> DISCORD_WELCOME_CHANNEL not set, not sending welcome message`);
	}
});

client.login(DISCORD_TOKEN);
