import Discord from 'discord.js';

/**
 * A simple command for testing.
 */
export default function ping(args: string, message: Discord.Message) {
	return 'pong!';
}
