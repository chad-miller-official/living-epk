import type {EpkApp} from "../apps/base.ts";

export type Launch = {
  init: () => EpkApp,
  windowDimensions: [number | null, number | null],
  x: number | null,
  y: number | null,
}

export function launchEvent(
  appInit: () => EpkApp,
  width: number | null = null,
  height: number | null = null,
  x: number | null = null,
  y: number | null = null,
): CustomEvent<Launch> {
  return new CustomEvent<Launch>('launch', {
    detail: {
      init: appInit,
      windowDimensions: [width, height],
      x,
      y
    },
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