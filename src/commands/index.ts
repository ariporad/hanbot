import Discord from 'discord.js';
import zoom from './zoom';
import welcome from './welcome';
import ping from './ping';

export type CommandHandler = (
	args: string,
	message: Discord.Message,
) => void | string | Promise<void | string>;

const COMMANDS: { [command: string]: null | CommandHandler } = {
	// Prevents commands from bubbling up the prototype chain
	__proto__: null,

	ping,
	zoom,
	welcome,
};

export default COMMANDS;
