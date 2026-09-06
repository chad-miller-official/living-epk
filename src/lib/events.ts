import type {EpkApp} from "../components/app.ts";

export enum DisallowFlags {
  DisallowResize = 0b001,
  DisallowFullscreen = 0b010,
  DisallowMinimize = 0b100,
}

export const DISALLOW_ALL = 0b111

export type LaunchOptions = {
  width?: number,
  height?: number,
  x?: number,
  y?: number,
  disallowFlags?: number,
}

export type Launch = {
  init: () => Promise<EpkApp>,
  windowDimensions: [number | null, number | null],
  x: number | null,
  y: number | null,
  disallowFlags: number,
}

export function launchEvent(
  appInit: () => Promise<EpkApp>,
  launchOptions: LaunchOptions = {}
): CustomEvent<Launch> {
  return new CustomEvent<Launch>('launch', {
    detail: {
      init: appInit,
      windowDimensions: [launchOptions.width || null, launchOptions.height || null],
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

export function closeEvent(requestingApp: EpkApp): CustomEvent<{ requestingApp: EpkApp }> {
  return new CustomEvent('close-window', {
    detail: {requestingApp},
    bubbles: true,
    composed: true,
  })
}

export function windowTitleChangeEvent(title: string): CustomEvent<{ title: string }> {
  return new CustomEvent('window-title-change', {
    detail: {title},
    bubbles: true,
    composed: true,
  })
}

export function userAlertEvent(message: string): CustomEvent<{ message: string }> {
  return new CustomEvent('user-alert', {
    detail: {message},
    bubbles: true,
    composed: true,
  })
}