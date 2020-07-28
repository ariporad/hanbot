import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { readFileSync, writeFileSync } from "fs";
import { version as latest } from "../config";
import zoomUsersReducer, { name as zoomUsersSlice} from "./zoom";
import linkedAccountsReducer, { name as linkedAccountsSlice } from "./link";

const PERSISTED_STATE = "../savedState.json"

const rootReducer = combineReducers({
  [zoomUsersSlice]: zoomUsersReducer,
  [linkedAccountsSlice]: linkedAccountsReducer,
});

type RootState = ReturnType<typeof rootReducer>;

// redux makes it super simple to recover state after a restart
const loadState = (): RootState | undefined => {
  try {
    // if the state shape changes, there should be logic added to convert from the older format
    const { state, version } = JSON.parse(readFileSync(PERSISTED_STATE, "utf-8"));
    return state;
  } catch (e) {
    return undefined;
  }
}

const store = configureStore({
  reducer: rootReducer,
  preloadedState: loadState(),
  devTools: false
});

// all changes are persisted to disk
store.subscribe(() => {
  const state = store.getState();
  writeFileSync(PERSISTED_STATE, JSON.stringify({ 
    state, 
    version: latest 
  }));
});

// runs the callback when the value of the selector changes
// for the sake of simplicity you have to create a single compound selector (instead of accepting a selector list)
const onSelector = <RT>(selector: (state: RootState) => RT, callback: (state: RT) => void, isEqual?: (a: RT, b: RT) => boolean) => {
  let previousValue = selector(store.getState());
  callback(previousValue);
  store.subscribe(() => {
    const currentValue = selector(store.getState());
    // check if value has changed
    if (isEqual ? isEqual(currentValue, previousValue) : currentValue !== previousValue) {
      previousValue = currentValue;
      callback(currentValue);
    }
  });
}

export default store;
export { onSelector };
export const { dispatch, getState } = store;
