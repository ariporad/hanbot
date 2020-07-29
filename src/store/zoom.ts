import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { zoomInfo } from '../commands/zoom';
import {
	ZOOM_TIME_THRESHOLD,
	ZOOM_TIME_ANNOUNCEMENT_CHANNEL,
	ZOOM_TIME_DEBOUNCE_HOURS,
} from '../config';

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
	joinUrl: string;
	lastZoomTime: number;
}

const initialState: ZoomState = {
	byId: {},
	online: [],
	temporary: [],
	hasSeenStart: false,
	active: false,
	joinUrl: '',
	lastZoomTime: -1,
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
				state.online = state.online.filter((zoomId) => zoomId !== payload.zoomId);
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
		return Object.values(zoomInfo.byId).find(
			({ name }) => name.toLowerCase() === zoomName.toLowerCase(),
		);
	});

export const {
	callStarted,
	callEnded,
	userLeft,
	userJoined,
	userLinked,
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
