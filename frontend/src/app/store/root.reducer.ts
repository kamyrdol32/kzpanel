import { isDevMode } from '@angular/core';
import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { ActionReducer, ActionReducerMap, MetaReducer } from '@ngrx/store';

export interface RootState {
  router: RouterReducerState;
}

export const reducers: ActionReducerMap<RootState> = {
  router: routerReducer,
};

function logger(reducer: ActionReducer<RootState>): ActionReducer<RootState> {
  return (state, action) => {
    const next = reducer(state, action);
    if (isDevMode()) {
      // eslint-disable-next-line no-console
      console.groupCollapsed(action.type);
      // eslint-disable-next-line no-console
      console.log('next state', next);
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
    return next;
  };
}

export const metaReducers: MetaReducer<RootState>[] = isDevMode() ? [logger] : [];
