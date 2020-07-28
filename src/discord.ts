import { Client, GuildMember } from "discord.js";
import { onSelector } from "./store";
import { createSelector } from "@reduxjs/toolkit";
import { getLinkedAccounts } from "./store/link";
import { getParticipants, getHasSeenStart, getCallIsActive } from "./store/zoom";
import { DISCORD_ACTIVE_ROLE } from "./config";


const getActiveDiscordUsers = createSelector(
	getLinkedAccounts, 
	getParticipants, 
	(linkedAccounts, participants) => {
		return participants.map(({ id }) => linkedAccounts.byId[id]?.discord).filter(Boolean);
});

const getZoomInfo = createSelector(
  getCallIsActive,
  getHasSeenStart,
  getParticipants,
  (active, hasSeenStart, participants) => ({
    active,
    hasSeenStart,
    participants,
  })
)

// keeps discord in sync with the server side state
export const syncDiscordStatus = (discord: Client) => {
  // get the active role on each server
  discord.guilds.cache.forEach(async (guild) => {
    console.log(`Syncing to ${guild.name}`);
    const roles = await guild.roles.fetch();
    // role to apply/remove
    const activeRole = roles.cache.find(role => role.name === DISCORD_ACTIVE_ROLE);
    if (!activeRole) {
      throw `${guild.name} does not have a ${DISCORD_ACTIVE_ROLE} role.`;
    }

    
    // keep roles in sync
    onSelector(getActiveDiscordUsers, async (activeUsers) => {
      // ensure members are up to date
      await guild.members.fetch();
      // update roles
      // filter is to prevent spamming the API with meaningless requests
      const shouldUpdateMember = (member: GuildMember): boolean => {
        return activeUsers.indexOf(member.id) > -1 || Boolean(member.roles.cache.find(role => role.id === activeRole.id));
      }
      guild.members.cache.filter(shouldUpdateMember).forEach(async member => {
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

    // keep status in sync
    onSelector(getZoomInfo, async ({active, hasSeenStart, participants}) => {
      if (active) {
        // Curently, the outer ternary is redundant because status is only set when active is true
        const status = active
          ? hasSeenStart && participants.length >= 0
            ? `with ${
                participants.length === 1 ? `1 person` : `${participants.length} people`
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
}