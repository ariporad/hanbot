import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface ZoomState {
	/**
	 * All of the zoom users seen by the bot, organized by Zoom ID
	 */
	byId: {
		[zoomId: string]: {
			zoomId: string;
			discordId?: string;
			name: string;
		};
	};
	/**
	 * Zoom IDs of users who are online
	 */
	online: string[];
	/**
	 * Zoom IDs of temporary (not signed in) users
	 */
	temporary: string[];
	/**
	 * Has the bot seen the start of the meeting?
	 * i.e. could there be users who joined before it was listening
	 */
	hasSeenStart: boolean;
	/**
	 * Is the Zoom meeting active?
	 */
	active: boolean;
	/**
	 * One-click URL to join the meeting
	 */
	joinUrl: string | null;
	/**
	 * Last time a zoom time ping was sent (in ms since epoch)
	 */
	lastZoomTime: number;
}

const initialState: ZoomState = {
	byId: {},
	online: [],
	temporary: [],
	hasSeenStart: false,
	active: false,
	joinUrl: null,
	lastZoomTime: -1,
};

type UserLeaveAction = PayloadAction<{ zoomId: string; name: string }>;
type UserJoinAction = PayloadAction<{ zoomId: string; name: string; temporary: boolean }>;
type UserLinkAction = PayloadAction<{ zoomId: string; discordId: string }>;

const { reducer, actions, name } = createSlice({
	name: 'zoomInfo',
	reducers: {
		callStart: (state) => {
			state.active = true;
			state.online = [];
			state.temporary = [];
		},
		callEnd: (state) => {
			state.active = false;
			state.hasSeenStart = true;
			state.online = [];
			// remove temp users
			state.temporary.forEach((id) => {
				delete state.byId[id];
			});
			state.temporary = [];
		},
		userLeave: (state, { payload }: UserLeaveAction) => {
			// always go for the most up to date name
			if (state.byId.hasOwnProperty(payload.zoomId)) {
				state.byId[payload.zoomId].name = payload.name;
			}

			if (!state.active) {
				console.log('WARNING: Zoom participant left while meeting was inactive. Ignoring.');
			} else {
				state.online = state.online.filter((zoomId) => zoomId !== payload.zoomId);
				if (state.temporary.indexOf(payload.zoomId) > -1) {
					state.temporary = state.temporary.filter((zoomId) => zoomId !== payload.zoomId);
					delete state.byId[payload.zoomId];
				}
			}
		},
		userJoin: (state, { payload: { temporary, ...payload } }: UserJoinAction) => {
			state.byId[payload.zoomId] = {
				...state.byId[payload.zoomId],
				...payload,
			};
			if (temporary) {
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
		linkUser: (state, { payload }: UserLinkAction) => {
			state.byId[payload.zoomId].discordId = payload.discordId;
		},
		setJoinUrl: (state, { payload }: PayloadAction<string>) => {
			state.joinUrl = payload;
		},
		setLastZoomTime: (state, { payload }: PayloadAction<number>) => {
			state.lastZoomTime = payload;
		},
	},
	initialState,
});

const getZoomInfo = (state: RootState): ZoomState => {
	return state[name];
};

const getOnlineUsers = createSelector(getZoomInfo, (zoomInfo) =>
	zoomInfo.online.map((id) => zoomInfo.byId[id]),
);

const getIsActive = createSelector(getZoomInfo, (zoomInfo) => zoomInfo.active);

const getHasSeenStart = createSelector(getZoomInfo, (zoomInfo) => zoomInfo.hasSeenStart);

const getJoinUrl = createSelector(getZoomInfo, (zoomInfo) => zoomInfo.joinUrl);

const getLastZoomTime = createSelector(getZoomInfo, (zoomInfo) => zoomInfo.lastZoomTime);

const getUserByName = (zoomName: string) =>
	createSelector(getZoomInfo, (zoomInfo) => {
		const match = Object.values(zoomInfo.byId).find(
			({ name }) => name.toLowerCase() === zoomName.toLowerCase(),
		);
		if (match) {
			return {
				...match,
				temporary: zoomInfo.temporary.indexOf(match.zoomId) > -1,
			};
		} else {
			return null;
		}
	});

export const {
	callStart,
	callEnd,
	userLeave,
	userJoin,
	linkUser,
	setJoinUrl,
	setLastZoomTime,
} = actions;
export {
	getZoomInfo,
	getOnlineUsers,
	getIsActive,
	getHasSeenStart,
	getUserByName,
	getJoinUrl,
	getLastZoomTime,
};
export { name };
export default reducer;
