export interface AppState {
  isLoaded: boolean;
  loading: boolean;
  error: string | null;
  data: any[];
}

export const initialAppState: AppState = {
  isLoaded: false,
  loading: false,
  error: null,
  data: []
}; 