import { Client, GuildMember, TextChannel } from "discord.js";
import { subscribeToSelector, dispatch } from "./store";
import { createSelector } from "@reduxjs/toolkit";
import {
  getOnlineUsers,
  getHasSeenStart,
  getIsActive,
  getLastZoomTime,
  setLastZoomTime,
} from "./store/zoom";
import { DISCORD_ACTIVE_ROLE, ZOOM_TIME_THRESHOLD, ZOOM_TIME_ANNOUNCEMENT_CHANNEL, ZOOM_TIME_DEBOUNCE_HOURS } from "./config";
import { formatMessage } from "./helpers";

const getActiveDiscordUsers = createSelector(
  getOnlineUsers,
  (onlineUsers) => {
    return onlineUsers.map((user) => user.discordId).filter(Boolean);
  }
);

const getZoomInfo = createSelector(
  getIsActive,
  getHasSeenStart,
  getOnlineUsers,
  (active, hasSeenStart, onlineUsers) => ({
    active,
    hasSeenStart,
    onlineUsers,
  })
);

const getZoomTimeInfo = createSelector(
  getOnlineUsers,
  getLastZoomTime,
  (onlineUsers, lastZoomTime) => ({
    onlineUsers, lastZoomTime
  })
);

// keeps discord in sync with the server side state
export const syncDiscordStatus = (discord: Client) => {
  // get the active role on each server
  discord.guilds.cache.forEach(async (guild) => {
    console.log(`Syncing to ${guild.name}`);

    const roles = await guild.roles.fetch();
    // role to apply/remove
    const activeRole = roles.cache.find(
      (role) => role.name === DISCORD_ACTIVE_ROLE
    );
    if (activeRole) {
      // keep roles in sync
      subscribeToSelector(getActiveDiscordUsers, async (activeUsers) => {
        // ensure members are up to date
        await guild.members.fetch();
        // update roles
        // filter is to prevent spamming the API with meaningless requests
        const shouldUpdateMember = (member: GuildMember): boolean => {
          return (
            activeUsers.indexOf(member.id) > -1 ||
            Boolean(
              member.roles.cache.find((role) => role.id === activeRole.id)
            )
          );
        };
        guild.members.cache
          .filter(shouldUpdateMember)
          .forEach(async (member) => {
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
    if (ZOOM_TIME_THRESHOLD &&
      ZOOM_TIME_ANNOUNCEMENT_CHANNEL) {
      subscribeToSelector(getZoomTimeInfo, ({ onlineUsers, lastZoomTime }) => {
        console.log(onlineUsers, lastZoomTime);
        if (onlineUsers.length === ZOOM_TIME_THRESHOLD && Date.now() - lastZoomTime >= ZOOM_TIME_DEBOUNCE_HOURS * 60 * 60 * 1e4) {
          const onlineUsersStr =
            onlineUsers.length === 1
              ? onlineUsers[0].name
              : `${onlineUsers
                .slice(0, -1)
                .map((p) => p.name)
                .join(",")}, and ${onlineUsers[onlineUsers.length - 1].name}`;

          dispatch(setLastZoomTime(Date.now()));
          discord.guilds.cache.map(async (guild) => {
            const channel = guild.channels.cache.find(
              (ch) =>
                ch.name.toLowerCase() ===
                ZOOM_TIME_ANNOUNCEMENT_CHANNEL?.toLowerCase()
            ) as TextChannel | undefined;

            if (!channel) return;

            await channel.send(formatMessage(guild)`
🚨 Paging everybody, ${onlineUsersStr} are starting a call, it's ${`%Zoom Time`}! 🚨
						`);
          })
        }
      });
    }

    // keep bot status in sync
    subscribeToSelector(
      getZoomInfo,
      async ({ active, hasSeenStart, onlineUsers }) => {
        if (active) {
          // Curently, the outer ternary is redundant because status is only set when active is true
          const status = active
            ? hasSeenStart && onlineUsers.length >= 0
              ? `with ${
              onlineUsers.length === 1
                ? `1 person`
                : `${onlineUsers.length} people`
              } on Zoom`
              : "on Zoom"
            : "with nobody"; /* currently disabled */

          console.log(`Setting Discord status to: ${status}`);
          await discord.user?.setActivity(status, { type: "PLAYING" });
        } else {
          console.log("Clearing Discord Status");
          // This is the best way I can find to clear activity (bots cant have custom statuses)
          await discord.user?.setActivity("", { type: "CUSTOM_STATUS" });
        }
      }
    );
  });
};
