import Discord from 'discord.js';
import { formatMessage, panic } from '../helpers';

export default function help(args: string, message: Discord.Message) {
	return formatMessage(message.guild || panic())`
I am ${'@Hanbot'}, the Olin Class of 2024's helpful bot.

In addition to sending a welcome message to new users when they join the server, I have a number of commands you can use. Just send \`!command\` in any channel (preferably ${'#bot-spam'}). You don't need to @mention me, and I don't respond to DMs.

Commands:
- \`!zoom\`: Get information about our Zooming, and see if anyone is on Zoom right now.
- \`!ping\`: A simple command for testing.
- \`!help\`: Show this message.
- \`!welcome\`: Demonstrate the welcome message sent to new users.

I was built by ${'@Ari (Han X)'} in the service of our glorious ${'%Clit leader'}. Ping ${'%Bot Builder'} if I'm acting up or if you need help.
	`;
}
