import Discord from 'discord.js';

export function panic(message?: string): never {
	throw new Error(message);
}

export function findChannel(guild: Discord.Guild, name: string) {
	return guild.channels.cache.find((guild) => guild.name === name);
}
