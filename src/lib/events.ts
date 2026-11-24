import type {EpkApp} from "../components/app.ts";
import type {LinkNode} from "./fs.ts";

export enum DisallowFlags {
  AllowAll = 0b0000,
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
  centered?: boolean,
}

export type Launch = {
  init: () => Promise<EpkApp>,
  windowDimensions: [number | null, number | null], // width, height
  position: [number | null, number | null] | 'center', // x, y
  disallowFlags: number,
}

export type FilePicked = {
  targetAppId: string,
  fileLinkNode?: LinkNode,
}

export type WindowProperties = {
  title?: string,
  fullscreen?: boolean,
  height?: number,
  disallowFlags?: number,
}

export function launchEvent(
  appInit: () => Promise<EpkApp>,
  launchOptions: LaunchOptions = {}
): CustomEvent<Launch> {
  return new CustomEvent<Launch>('launch', {
    detail: {
      init: appInit,
      windowDimensions: [launchOptions.width || null, launchOptions.height || null],
      position: launchOptions.centered ? 'center' : [launchOptions.x || null, launchOptions.y || null],
      disallowFlags: launchOptions.disallowFlags || 0,
    },
    bubbles: true,
    composed: true,
  })
}

export function activeWindowChangeEvent(targetAppId?: string): CustomEvent {
  return new CustomEvent('active-window-change', {
    detail: {targetAppId},
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

export function filePickedEvent(targetAppId: string, linkNode?: LinkNode): CustomEvent<FilePicked> {
  return new CustomEvent('file-picked', {
    detail: {
      targetAppId,
      fileLinkNode: linkNode
    },
    bubbles: true,
    composed: true,
  })
}