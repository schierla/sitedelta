export enum PageState {
  ERROR = 0,
  LOADED = 1,
  HIGHLIGHTED = 2,
  SELECTREGION = 3,
}

export interface StateError {
  state: PageState.ERROR;
}

export interface StateLoaded {
  state: PageState.LOADED;
}

export interface StateSelectRegion {
  state: PageState.SELECTREGION;
}

export interface StateHighlighted {
  state: PageState.HIGHLIGHTED;
  changes: number;
  current: number;
}

export type HighlightState =
  | StateError
  | StateLoaded
  | StateSelectRegion
  | StateHighlighted;
