import Discord from 'discord.js';

export default function ping(args: string, message: Discord.Message) {
	return 'pong!';
}
