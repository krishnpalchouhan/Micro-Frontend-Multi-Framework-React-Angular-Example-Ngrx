import { createReducer, on } from '@ngrx/store';
import { AppState, initialAppState } from '../app.state';
import * as AppActions from '../actions/app.actions';

export const appFeatureKey = 'app';

export const appReducer = createReducer(
  initialAppState,
  on(AppActions.loadApp, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AppActions.loadAppSuccess, (state, { data }) => ({
    ...state,
    isLoaded: true,
    loading: false,
    data
  })),
  on(AppActions.loadAppFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
); 