import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";

interface ZoomState {
  byId: {
    [id: string]: {
      id: string;
      name: string;
    };
  };
  online: string[];
  temporary: string[];
  hasSeenStart: boolean;
  active: boolean;
};

const initialState: ZoomState = {
  byId: {},
  online: [],
  temporary: [],
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
      state.temporary = [];
    },
    callEnded: (state) => {
      state.active = false;
      state.hasSeenStart = true;
      state.online = [];
      // remove temp users
      state.temporary.forEach(id => {
        delete state.byId[id];
      });
      state.temporary = [];
    },
    userLeft: (state, { payload }: UserEventAction) => {
      // always go for the most up to date name
      if(state.byId.hasOwnProperty(payload.id)) {
        state.byId[payload.id].name = payload.name;
      }
        
      if (!state.active) {
        console.log(
          'WARNING: Zoom participant left while meeting was inactive. Ignoring.',
        );
      } else {
        state.online = state.online.filter( (id) => id !== payload.id );
      }
    },
    userJoined: (state, { payload }: PayloadAction<{ temporary: boolean }> & UserEventAction) => {
      state.byId[payload.id] = payload;
      if (payload.temporary) {
        state.temporary.push(payload.id);
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

const getZoomUsers = (state: RootState): ZoomState => {
  return state[name];
}

const getParticipants = createSelector(getZoomUsers, (zoomUsers) => 
  zoomUsers.online.map(id => zoomUsers.byId[id])
);

const getCallIsActive = createSelector(getZoomUsers, (zoomUsers) => zoomUsers.active);

const getHasSeenStart = createSelector(getZoomUsers, (zoomUsers) => zoomUsers.hasSeenStart);

const getUserByName = (zoomName: string) => (state: RootState): string | undefined => {
  const zoomUsers = getZoomUsers(state);
  const matching = Object.values(zoomUsers.byId)
    .find(({ name }) => name.toLowerCase() === zoomName.toLowerCase());
  return matching?.name;
}

export const { callStarted, callEnded, userLeft, userJoined } = actions;
export { getZoomUsers, getParticipants, getCallIsActive, getHasSeenStart, getUserByName };
export { name };
export default reducer;