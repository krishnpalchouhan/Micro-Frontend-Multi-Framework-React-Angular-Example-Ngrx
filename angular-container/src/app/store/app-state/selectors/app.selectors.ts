import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState } from '../app.state';
import { appFeatureKey } from '../reducers/app.reducer';

export const selectAppState = createFeatureSelector<AppState>(appFeatureKey);

export const selectAppLoading = createSelector(
  selectAppState,
  (state: AppState) => state.loading
);

export const selectAppLoaded = createSelector(
  selectAppState,
  (state: AppState) => state.isLoaded
);

export const selectAppData = createSelector(
  selectAppState,
  (state: AppState) => state.data
);

export const selectAppError = createSelector(
  selectAppState,
  (state: AppState) => state.error
); 