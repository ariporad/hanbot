import Discord from 'discord.js';
import { formatMessage, panic } from '../helpers';
import { version, PRODUCTION } from '../config';

export default function help(args: string, message: Discord.Message) {
	return formatMessage(message.guild || panic())`
I am ${message.client.user || '@Hanbot'}, the Olin Class of 2024's helpful bot. (Version ${version})

In addition to sending a welcome message to new users when they join the server, I have a number of commands you can use. Just send \`!command\` in any channel (preferably ${'#bot-spam'}). You don't need to @mention me, and I don't respond to DMs.

Commands:
- \`!zoom\`: See if anyone is on Zoom right now.
- \`!zoominfo\`: Information about our Zooming habits.
- \`!link Zoom Name\`: Link your Discord account to Zoom (so you can get a role while Zooming).
- \`!ping\`: A simple command for testing.
- \`!help\`: Show this message.
- \`!welcome\`: Demonstrate the welcome message sent to new users.
- \`!debuginfo\`: Dump lots of information that might be helpful for debugging.

I was built by ${'@Ari (Han X)'} in the service of our glorious leader, Han. Ping ${'%Bot Builder'} if I'm acting up or if you need help. My code is available on Github, and PRs are welcome if you'd like to add functionality: https://github.com/ariporad/hanbot.

${
		// This is pretty ugly.
		PRODUCTION
			? ''
			: `_This copy of me is currently being tinkered with by my glorious creators so I can better aid in the spreading of the Gospel of Han. As a result, I may not work quite right.${
			message.client.user?.username === 'Hanbot'
				? ''
				: ` Try ${formatMessage(
					message.guild || panic(),
				)`${'@Hanbot'}`} for the real deal.`
			}_`
		}
	`;
}
