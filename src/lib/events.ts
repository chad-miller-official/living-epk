import type {EpkApp} from "../apps/base.ts";

export type Launch = {
  init: () => EpkApp,
}

export function launchEvent(appInit: () => EpkApp): CustomEvent<Launch> {
  return new CustomEvent<Launch>('launch', {
    detail: {init: appInit},
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