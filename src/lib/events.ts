import type {EpkWindow} from "../components/window.ts";

export type Launch = {
  init: () => EpkWindow,
}

export function launchEvent(windowCreator: () => EpkWindow): CustomEvent<Launch> {
  return new CustomEvent<Launch>('launch', {
    detail: {init: windowCreator},
    bubbles: true,
    composed: true,
  })
}

export function activeWindowChangeEvent(): CustomEvent {
  return new CustomEvent('active-window-change', {
    bubbles: true,
    composed: true,
  })
}