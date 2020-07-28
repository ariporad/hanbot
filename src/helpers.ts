import Discord, { TextBasedChannelFields, PartialTextBasedChannelFields, Collection } from 'discord.js';

/**
 * Inconvinently, `throw` is not an expression in Javascript, so you can't do foo() || throw ...;
 *
 * Instead, we have panic, which does exactly the same thing.
 */
export function panic(message?: string): never {
	throw new Error(message);
}

/**
 * Format a date in 'M/D/YYYY, H:M:S PM PT (Xd, Xh, Xm, Xs)' format.
 */
export const formatUptime = (since: Date): string => {
	const uptime = Date.now() - since.getTime();

	const dateStr = since.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });

	const days = Math.round(uptime / 1000 / 60 / 60 / 24);
	const hours = Math.round((uptime / 1000 / 60 / 60) % 24);
	const minutes = Math.round((uptime / 1000 / 60) % 60);
	const seconds = Math.round((uptime / 1000) % 60);

	return `${dateStr} PT (${days}d, ${hours}h, ${minutes}m, ${seconds}s ago)`;
};

/**
 * Format a discord message.
 *
 * Use it like this:
 *
 * formatMessage(guild)`Hello ${"@user"}, see ${"#channel"} or ping ${"%Role"}`
 *
 * And everything will be properly linkified.
 */
export const formatMessage = (guild: Discord.Guild) => (
	strings: TemplateStringsArray,
	...refs: (string | TextBasedChannelFields | PartialTextBasedChannelFields)[]
): string => {
	const processedRefs = refs.map((ref) => {
		if (typeof ref !== 'string') return ref;

		const type = ref[0];
		const name = ref.slice(1);
		switch (type) {
			case '@': // User
				return guild.members.cache.find((user) => user.displayName === name) || ref;
			case '%': // Role
				return guild.roles.cache.find((role) => role.name === name) || ref;
			case '#': // Channel
				return guild.channels.cache.find((channel) => channel.name === name) || ref;
			default:
				return ref;
		}
	});

	let output: string = '';

	for (let i = 0; i < strings.length - 1; i++) {
		output += strings[i] + processedRefs[i].toString();
	}

	output += strings[strings.length - 1];

	return output.trim();
};

export const mapToArray = <T>(map: Collection<string, T>): Array<T> => {
	return Array.from(map.values());
}