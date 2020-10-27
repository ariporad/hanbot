import Discord from 'discord.js';
import { zoomInfo, zoomStatus } from './zoom';
import welcome from './welcome';
import ping from './ping';
import help from './help';
import link from './link';
import statusHistory from './statusHistory';
import { debugInfo } from './debugInfo';

export type CommandHandler = (
	args: string,
	message: Discord.Message,
) => void | string | Promise<void | string>;

const COMMANDS: { [command: string]: null | CommandHandler } = {
	// Prevents commands from bubbling up the prototype chain
	__proto__: null,

	ping,
	zoom: zoomStatus,
	zoominfo: zoomInfo,
	debuginfo: debugInfo,
	statushistory: statusHistory,
	welcome,
	help,
	link,
};

export default COMMANDS;
