import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { getParticipants } from "./zoom";
import { RootState } from "../store";

interface LinkedAccountsState {
  byId: {
    [id: string]: {
      id: string;
      discord: string;
    };
  };
};

const initialState: LinkedAccountsState = {
  byId: {},
};

type UserLinkAction = PayloadAction<{ id: string, discord: string }>;

const { reducer, actions, name } = createSlice({
  name: "linkedAccounts",
  reducers: {
    accountLinked: (state, { payload }: UserLinkAction) => {
      state.byId[payload.id] = payload;
    }
  },
  initialState,
});

const getLinkedAccounts = (state: RootState): LinkedAccountsState => {
  return state[name];
}

export const { accountLinked } = actions;
export { getLinkedAccounts };
export { name };
export default reducer;