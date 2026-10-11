import type {EpkApp} from "../components/app.ts";

export enum DisallowFlags {
  DisallowMaximize = 0b0001,
  DisallowMinimize = 0b0010,
  DisallowVerticalResize = 0b0100,
  DisallowHorizontalResize = 0b1000,
  DisallowResize = DisallowVerticalResize | DisallowHorizontalResize,
  DisallowAll = DisallowMaximize | DisallowMinimize | DisallowResize,
}

export type LaunchOptions = {
  width?: number,
  height?: number,
  x?: number,
  y?: number,
  disallowFlags?: number,
  fullscreen?: boolean,
}

export type Launch = {
  init: () => Promise<EpkApp>,
  windowDimensions: [number | null, number | null] | 'fullscreen',
  x: number | null,
  y: number | null,
  disallowFlags: number,
}

export type WindowProperties = {
  title?: string,
}

export function launchEvent(
  appInit: () => Promise<EpkApp>,
  launchOptions: LaunchOptions = {}
): CustomEvent<Launch> {
  return new CustomEvent<Launch>('launch', {
    detail: {
      init: appInit,
      windowDimensions: launchOptions.fullscreen ? 'fullscreen' : [launchOptions.width || null, launchOptions.height || null],
      x: launchOptions.x || null,
      y: launchOptions.y || null,
      disallowFlags: launchOptions.disallowFlags || 0,
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

export function closeWindowEvent(): CustomEvent {
  return new CustomEvent('close-window', {
    bubbles: true,
    composed: true,
  })
}

export function windowPropertyChangeEvent(props: WindowProperties): CustomEvent<WindowProperties> {
  return new CustomEvent('window-property-change', {
    detail: props,
    bubbles: true,
    composed: true,
  })
}