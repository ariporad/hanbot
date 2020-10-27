import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { stat } from 'fs';
import { RootState } from '.';

interface StatusMessageTrackerState {
	/**
	 * Status message history by Discord user
	 */
	byDiscordId: {
		[discordId: string]: { timestamp: number; message: string }[];
	};

	/**
	 * Discord IDs of users who have opted in to Discord status message tracking.
	 */
	optedInIDs: string[];
}

const initialState: StatusMessageTrackerState = {
	byDiscordId: {},
	optedInIDs: [],
};

type UserOptInAction = PayloadAction<{ discordId: string }>;
type UserOptOutAction = PayloadAction<{ discordId: string }>;
type UserStatusMessageUpdateAction = PayloadAction<{
	discordId: string;
	timestamp: number;
	message: string;
}>;

const { reducer, actions, name } = createSlice({
	name: 'statusMessageTracker',
	reducers: {
		userOptIn: (state, { payload }: UserOptInAction) => {
			state.optedInIDs.push(payload.discordId);
			state.byDiscordId[payload.discordId] = [];
		},

		userOptOut: (state, { payload }: UserOptOutAction) => {
			state.optedInIDs = state.optedInIDs.filter((id) => id !== payload.discordId);
			delete state.byDiscordId[payload.discordId];
		},

		userStatusMessageUpdate: (state, { payload }: UserStatusMessageUpdateAction) => {
			if (!state.optedInIDs.includes(payload.discordId)) return;

			if (!state.byDiscordId[payload.discordId]) state.byDiscordId[payload.discordId] = [];

			const history = state.byDiscordId[payload.discordId];

			if (
				history.length >= 1 &&
				history[history.length - 1].message.trim() === payload.message.trim()
			) {
				return;
			}

			history.push({
				timestamp: payload.timestamp,
				message: payload.message,
			});
		},
	},
	initialState,
});

const getStatusMessageState = (state: RootState): StatusMessageTrackerState => {
	return state[name];
};

const getUserIsOptedIn = (discordId: string) =>
	createSelector(getStatusMessageState, (state) => state.optedInIDs.includes(discordId));

const getStatusMessageHistoryForUser = (discordId: string) =>
	createSelector(getStatusMessageState, (state) => state.byDiscordId[discordId] || []);

export const { userOptIn, userOptOut, userStatusMessageUpdate } = actions;
export { getUserIsOptedIn, getStatusMessageHistoryForUser };
export { name };
export default reducer;
