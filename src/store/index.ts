import { configureStore, combineReducers, current } from '@reduxjs/toolkit';
import { readFileSync, writeFile } from 'fs';
import { version as latest, PERSISTED_STATE_FILE } from '../config';
import zoomInfoReducer, { name as zoomInfoSlice } from './zoom';

const rootReducer = combineReducers({
	[zoomInfoSlice]: zoomInfoReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

// redux makes it super simple to recover state after a restart
const loadState = (): RootState | undefined => {
	try {
		// if the state shape changes, there should be logic added to convert from the older format
		const { state, version } = JSON.parse(readFileSync(PERSISTED_STATE_FILE, 'utf-8'));
		return state;
	} catch (e) {
		console.error('Error: unable to load persisted state', e);
		return undefined;
	}
};

const store = configureStore({
	reducer: rootReducer,
	preloadedState: loadState(),
	devTools: false,
});

// all changes are persisted to disk
store.subscribe(() => {
	const state = store.getState();
	writeFile(
		PERSISTED_STATE_FILE,
		JSON.stringify({
			state,
			version: latest,
		}),
		() => {},
	);
});

// runs the callback when the value of the selector changes
// for the sake of simplicity you have to create a single compound selector (instead of accepting a selector list)
const subscribeToSelector = <RT>(
	selector: (state: RootState) => RT,
	callback: (state: RT) => void,
	isEqual: (a: RT, b: RT) => boolean = (a, b) => a === b,
) => {
	let previousValue = selector(store.getState());
	store.subscribe(() => {
		const currentValue = selector(store.getState());
		// check if value has changed
		if (!isEqual(currentValue, previousValue)) {
			previousValue = currentValue;
			callback(currentValue);
		}
	});
	callback(previousValue);
};

export default store;
export { subscribeToSelector };
export const { dispatch, getState } = store;
