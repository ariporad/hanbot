import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface ZoomState {
	byId: {
		[zoomId: string]: {
			zoomId: string;
			discordId: string;
			name: string;
		};
	};
	online: string[];
	temporary: string[];
	hasSeenStart: boolean;
	active: boolean;
}

const initialState: ZoomState = {
	byId: {},
	online: [],
	temporary: [],
	hasSeenStart: false,
	active: false,
};

type UserEventAction = PayloadAction<{ zoomId: string; name: string }>;
type UserLinkAction = PayloadAction<{ zoomId: string; discordId: string }>;

const { reducer, actions, name } = createSlice({
	name: 'zoomInfo',
	reducers: {
		callStarted: (state) => {
			state.active = true;
			state.online = [];
			state.temporary = [];
		},
		callEnded: (state) => {
			state.active = false;
			state.hasSeenStart = true;
			state.online = [];
			// remove temp users
			state.temporary.forEach((id) => {
				delete state.byId[id];
			});
			state.temporary = [];
		},
		userLeft: (state, { payload }: UserEventAction) => {
			// always go for the most up to date name
			if (state.byId.hasOwnProperty(payload.zoomId)) {
				state.byId[payload.zoomId].name = payload.name;
			}

			if (!state.active) {
				console.log('WARNING: Zoom participant left while meeting was inactive. Ignoring.');
			} else {
				state.online = state.online.filter((id) => id !== payload.id);
			}
		},
		userJoined: (
			state,
			{ payload }: PayloadAction<{ temporary: boolean }> & UserEventAction,
		) => {
			state.byId[payload.zoomId] = {
				...state.byId[payload.zoomId],
				...payload,
			};
			if (payload.temporary) {
				state.temporary.push(payload.zoomId);
			}
			if (!state.active) {
				console.log(
					'WARNING: Zoom participant joined while meeting was inactive. Ignoring.',
				);
			} else {
				state.online.push(payload.zoomId);
			}
		},
		userLinked: (state, { payload }: UserLinkAction) => {
			state.byId[payload.zoomId].discordId = payload.discordId;
		},
	},
	initialState,
});

const getZoomInfo = (state: RootState): ZoomState => {
	return state[name];
};

const getParticipants = createSelector(getZoomInfo, (zoomInfo) =>
	zoomInfo.online.map((id) => zoomInfo.byId[id]),
);

const getCallIsActive = createSelector(getZoomInfo, (zoomInfo) => zoomInfo.active);

const getHasSeenStart = createSelector(getZoomInfo, (zoomInfo) => zoomInfo.hasSeenStart);

const getUserByName = (zoomName: string) =>
	createSelector(getZoomInfo, (zoomInfo) => {
		const matching = Object.values(zoomInfo.byId).find(
			({ name }) => name.toLowerCase() === zoomName.toLowerCase(),
		);
		return matching?.name;
	});

export const { callStarted, callEnded, userLeft, userJoined, userLinked } = actions;
export { getZoomInfo, getParticipants, getCallIsActive, getHasSeenStart, getUserByName };
export { name };
export default reducer;
