import Discord, { TextBasedChannelFields, PartialTextBasedChannelFields } from 'discord.js';

/**
 * Inconvinently, `throw` is not an expression in Javascript, so you can't do foo() || throw ...;
 *
 * Instead, we have panic, which does exactly the same thing.
 */
export function panic(message?: string): never {
	throw new Error(message);
}

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
