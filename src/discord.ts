import { Client, GuildMember, TextChannel } from 'discord.js';
import { subscribeToSelector, dispatch } from './store';
import { createSelector } from '@reduxjs/toolkit';
import {
	getOnlineUsers,
	getHasSeenStart,
	getIsActive,
	getLastZoomTime,
	setLastZoomTime,
} from './store/zoom';
import {
	DISCORD_ZOOM_ACTIVE_ROLE,
	ZOOM_TIME_THRESHOLD,
	ZOOM_TIME_ANNOUNCEMENT_CHANNEL,
	ZOOM_TIME_DEBOUNCE_HOURS,
} from './config';
import { formatMessage } from './helpers';
import { userStatusMessageUpdate } from './store/statusMessageTracker';

const getOnlineDiscordUsers = createSelector(getOnlineUsers, (onlineUsers) => {
	return onlineUsers.map((user) => user.discordId).filter((x) => !!x);
});

const getZoomStatusInfo = createSelector(
	getIsActive,
	getHasSeenStart,
	getOnlineUsers,
	(active, hasSeenStart, onlineUsers) => ({
		active,
		hasSeenStart,
		onlineUsers,
	}),
);

const getZoomTimeInfo = createSelector(
	getOnlineUsers,
	getLastZoomTime,
	(onlineUsers, lastZoomTime) => ({
		onlineUsers,
		lastZoomTime,
	}),
);

// keeps discord in sync with the server side state
export const registerDiscordStatusSubscriptions = (discord: Client) => {
	// get the active role on each server
	discord.guilds.cache.forEach(async (guild) => {
		console.log(`Syncing to ${guild.name}`);

		const roles = await guild.roles.fetch();
		// role to apply/remove
		const activeRole = roles.cache.find((role) => role.name === DISCORD_ZOOM_ACTIVE_ROLE);
		if (activeRole) {
			// keep roles in sync
			subscribeToSelector(getOnlineDiscordUsers, async (activeUsers) => {
				// ensure members are up to date
				await guild.members.fetch();
				// update roles
				// filter is to prevent spamming the API with meaningless requests
				const shouldUpdateMember = (member: GuildMember): boolean => {
					return (
						activeUsers.indexOf(member.id) > -1 ||
						!!member.roles.cache.find((role) => role.id === activeRole.id)
					);
				};
				guild.members.cache.filter(shouldUpdateMember).forEach(async (member) => {
					// bypass cache
					await member.fetch();
					if (activeUsers.indexOf(member.id) > -1) {
						// use should have role
						await member.roles.add(activeRole.id);
					} else {
						// take it away
						await member.roles.remove(activeRole.id);
					}
				});
			});
		}

		// fire off zoomtime notifications
		if (ZOOM_TIME_THRESHOLD && ZOOM_TIME_ANNOUNCEMENT_CHANNEL) {
			subscribeToSelector(
				getZoomTimeInfo,
				({ onlineUsers, lastZoomTime }, { onlineUsers: prevOnlineUsers }) => {
					if (
						prevOnlineUsers.length < onlineUsers.length &&
						onlineUsers.length === ZOOM_TIME_THRESHOLD &&
						Date.now() - lastZoomTime >= ZOOM_TIME_DEBOUNCE_HOURS * 60 * 60 * 1000
					) {
						const onlineUsersStr =
							onlineUsers.length === 1
								? onlineUsers[0].name
								: `${onlineUsers
										.slice(0, -1)
										.map((p) => p.name)
										.join(',')}, and ${
										onlineUsers[onlineUsers.length - 1].name
								  }`;

						dispatch(setLastZoomTime(Date.now()));
						discord.guilds.cache.map(async (guild) => {
							const channel = guild.channels.cache.find(
								(ch) =>
									ch.name.toLowerCase() ===
									ZOOM_TIME_ANNOUNCEMENT_CHANNEL?.toLowerCase(),
							) as TextChannel | undefined;

							if (!channel) return;

							await channel.send(formatMessage(guild)`
🚨 Paging everybody, ${onlineUsersStr} are starting a call, it's ${`%Zoom Time`}! 🚨
						`);
						});
					}
				},
			);
		}

		// keep bot status in sync
		subscribeToSelector(getZoomStatusInfo, async ({ active, hasSeenStart, onlineUsers }) => {
			if (active) {
				// Curently, the outer ternary is redundant because status is only set when active is true
				const status = active
					? hasSeenStart && onlineUsers.length >= 0
						? `with ${
								onlineUsers.length === 1
									? `1 person`
									: `${onlineUsers.length} people`
						  } on Zoom`
						: 'on Zoom'
					: 'with nobody'; /* currently disabled */

				console.log(`Setting Discord status to: ${status}`);
				await discord.user?.setActivity(status, { type: 'PLAYING' });
			} else {
				console.log('Clearing Discord Status');
				// This is the best way I can find to clear activity (bots cant have custom statuses)
				await discord.user?.setActivity('', { type: 'CUSTOM_STATUS' });
			}
		});
	});

	// track custom status/presence messages
	discord.on('presenceUpdate', async (oldPresence, newPresence) => {
		const activity = newPresence.activities.find(
			(activity) => activity.type === 'CUSTOM_STATUS',
		);

		if (!activity || !activity.state) return;

		console.log('got new activity:', newPresence.member?.user.username, activity.state);

		dispatch(
			userStatusMessageUpdate({
				timestamp: activity.createdTimestamp,
				discordId: newPresence.userID,
				message: activity.state,
			}),
		);
	});
};
