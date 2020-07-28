import { Client } from "discord.js";
import { onSelector } from "./store";
import { createSelector } from "@reduxjs/toolkit";
import { getLinkedAccounts } from "./store/link";
import { getParticipants, getHasSeenStart, getCallIsActive } from "./store/zoom";
import { mapToArray } from "./helpers";


const getActiveDiscordUsers = createSelector(
	getLinkedAccounts, 
	getParticipants, 
	(linkedAccounts, participants) => {
		return participants.map(({ id }) => linkedAccounts.byId[id].discord)
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

const ACTIVE_ROLE = "Zoomer";

// keeps discord in sync with the server side state
export const syncDiscordStatus = (discord: Client) => {
  // get the active role on each server
  discord.guilds.cache.forEach(async (guild) => {
    const roles = await guild.roles.fetch();
    // role to apply/remove
    const activeRole = mapToArray(roles.cache.filter(role => role.name === ACTIVE_ROLE))[1];
    
    // keep roles in sync
    onSelector(getActiveDiscordUsers, async (activeUsers) => {
      // ensure members are up to date
      await guild.members.fetch();
      // update roles
      guild.members.cache.forEach(member => {
        if (activeUsers.indexOf(member.id) > -1) {
          // use should have role
          member.roles.add(activeRole);
        } else {
          // take it away
          member.roles.remove(activeRole);
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