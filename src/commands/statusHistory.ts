import Discord from 'discord.js';
import { dispatch, getState } from '../store';
import { formatMessage, panic } from '../helpers';
import {
	getStatusMessageHistoryForUser,
	getUserIsOptedIn,
	userOptIn,
	userOptOut,
} from '../store/statusMessageTracker';

export default function statusHistory(args: string, message: Discord.Message) {
	const name = args.trim();
	const state = getState();

	if (name === 'opt in' || name === 'opt-in') {
		dispatch(userOptIn({ discordId: message.author.id }));
		return formatMessage(message.guild || panic())`
			${message.author} You've opted in to status history tracking! From now on, any custom text set as your Discord status will be recorded! You (and anyone else) can view this log by sending \`!statushistory ${message.author}\`. If you ever want to opt out in the future, simply send \`!statushistory opt-out\` to opt out and delete all history.
		`;
	} else if (name === 'opt out' || name === 'opt-out') {
		dispatch(userOptOut({ discordId: message.author.id }));
		return formatMessage(message.guild || panic())`
			${message.author} You've opted out of status history tracking! All previous Discord statuses have been erased and no future statuses will be recorded. To opt-in again, send \`!statushistory opt-in\`.
		`;
	} else {
		const user = message.mentions.members?.first() || message.author;

		if (!getUserIsOptedIn(user.id)(getState())) {
			return formatMessage(message.guild || panic())`
				${message.author} Sorry! It looks like ${user} hasn't opted in to status history tracking! They can run \`!statushistory opt-in\` to start tracking their status history.
			`;
		}

		const history = getStatusMessageHistoryForUser(user.id)(getState());

		return formatMessage(message.guild || panic())`
Discord Status Message History for ${user}:
${history
	.map(
		({ timestamp, message }) =>
			`- ${message} (${new Date(timestamp).toLocaleString('en-US', {
				timeZone: 'America/New_York',
			})})`,
	)
	.join('\n')}
		`;
	}
}
