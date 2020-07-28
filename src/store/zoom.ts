import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";

interface ZoomState {
  byId: {
    [id: string]: {
      id: string;
      name: string;
    };
  };
  allIds: string[];
  online: string[];
  hasSeenStart: boolean;
  active: boolean;
};

const initialState: ZoomState = {
  byId: {},
  allIds: [],
  online: [],
  hasSeenStart: false,
  active: false
};

type UserEventAction = PayloadAction<{ id: string, name: string }>;

const { reducer, actions, name } = createSlice({
  name: "zoomUsers",
  reducers: {
    callStarted: (state) => {
      state.active = true;
      state.online = [];
    },
    callEnded: (state) => {
      state.active = false;
      state.hasSeenStart = true;
      state.online = [];
    },
    userLeft: (state, { payload }: UserEventAction) => {
      const knownUser = state.byId.hasOwnProperty(payload.id);
      if (!knownUser) {
        state.byId[payload.id] = payload;
        state.allIds.push(payload.id);
      } else {
        if (!state.active) {
          console.log(
            'WARNING: Zoom participant left while meeting was inactive. Ignoring.',
          );
        } else {
          state.online = state.online.filter( (id) => id !== payload.id );
        }
      }
    },
    userJoined: (state, { payload }: UserEventAction) => {
      const knownUser = state.byId.hasOwnProperty(payload.id);
      if (!knownUser) {
        state.byId[payload.id] = payload;
        state.allIds.push(payload.id);
      }
      if (!state.active) {
				console.log(
					'WARNING: Zoom participant joined while meeting was inactive. Ignoring.',
				);
			} else {
        state.online.push(payload.id);
      }
    }
  },
  initialState,
});

type RootState = { [name]: ZoomState };

const getZoomUsers = (state: RootState): ZoomState => {
  return state[name];
}

const getParticipants = createSelector(getZoomUsers, (zoomUsers) => 
  zoomUsers.online.map(id => zoomUsers.byId[id])
);

const getCallIsActive = createSelector(getZoomUsers, (zoomUsers) => zoomUsers.active);

const getHasSeenStart = createSelector(getZoomUsers, (zoomUsers) => zoomUsers.hasSeenStart);

const getUserByName = (zoomName: string) => (state: RootState): string | null => {
  const zoomUsers = getZoomUsers(state);
  const matching = zoomUsers.allIds
    .map(id => zoomUsers.byId[id])
    .filter(({ name }) => name.toLowerCase() === zoomName.toLowerCase());
  return matching.length === 1 ? matching[0].id : null;
}

export const { callStarted, callEnded, userLeft, userJoined } = actions;
export { getZoomUsers, getParticipants, getCallIsActive, getHasSeenStart, getUserByName };
export { name };
export default reducer;