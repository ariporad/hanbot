import Discord from 'discord.js';
import { formatMessage, panic } from '../helpers';
import { version } from '../config';

export default function help(args: string, message: Discord.Message) {
	return formatMessage(message.guild || panic())`
I am ${'@Hanbot'}, the Olin Class of 2024's helpful bot. (Version ${version})

In addition to sending a welcome message to new users when they join the server, I have a number of commands you can use. Just send \`!command\` in any channel (preferably ${'#bot-spam'}). You don't need to @mention me, and I don't respond to DMs.

Commands:
- \`!zoom\`: See if anyone is on Zoom right now.
- \`!zoominfo\`: Information about our Zooming habits.
- \`!ping\`: A simple command for testing.
- \`!help\`: Show this message.
- \`!welcome\`: Demonstrate the welcome message sent to new users.

I was built by ${'@Ari (Han X)'} in the service of our glorious leader, ${'@Han (Han)'}. Ping ${'%Bot Builder'} if I'm acting up or if you need help. My code is available on Github, and PRs are welcome if you'd like to add functionality: https://github.com/ariporad/hanbot. I'm currently hosted on ${'@Ari (Han X)'}'s laptop, but I'll be moving soon to proper hosting.
	`;
}
