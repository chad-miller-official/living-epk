import type {EpkApp} from "../components/app.ts";
import type {LinkNode} from "./fs.ts";
import type {EpkWindow} from "../components/window.ts";
import type {Dimensions, Point} from "@interactjs/core/types";

export const LAUNCH_EVENT = 'launch'

export type Launch = {
  init: () => Promise<EpkApp>,
  size?: Partial<Dimensions>,
  location?: Partial<Point> | 'center',
  disallowFlags?: number,
}

export function launchEvent(
  appInit: Pick<Launch, 'init'>['init'],
  launchOptions: Omit<Launch, 'init'> = {}
): CustomEvent<Launch> {
  return new CustomEvent<Launch>(LAUNCH_EVENT, {
    detail: {
      init: appInit,
      ...launchOptions
    },
    bubbles: true,
    composed: true,
  })
}

export const ACTIVE_WINDOW_CHANGE_EVENT = 'active-window-change'
export type ActiveWindowChange = { targetAppId?: string }

export function activeWindowChangeEvent(targetAppId?: string): CustomEvent<ActiveWindowChange> {
  return new CustomEvent<ActiveWindowChange>(ACTIVE_WINDOW_CHANGE_EVENT, {
    detail: {targetAppId},
    bubbles: true,
  })
}

export const CLOSE_WINDOW_EVENT = 'close-window'

export function closeWindowEvent(): CustomEvent {
  return new CustomEvent(CLOSE_WINDOW_EVENT, {bubbles: true})
}

export const WINDOW_PROPERTY_CHANGE_EVENT = 'window-property-change'
export type WindowProperties = Partial<Pick<EpkWindow, 'title' | 'size' | 'disallowFlags' | 'state'>>

export function windowPropertyChangeEvent(props: WindowProperties): CustomEvent<WindowProperties> {
  return new CustomEvent<WindowProperties>(WINDOW_PROPERTY_CHANGE_EVENT, {
    detail: props,
    bubbles: true,
  })
}

export const FILE_PICKED_EVENT = 'file-picked'

export type FilePicked = {
  targetAppId: string,
  fileLinkNode?: LinkNode,
}

export function filePickedEvent(props: FilePicked): CustomEvent<FilePicked> {
  return new CustomEvent<FilePicked>(FILE_PICKED_EVENT, {
    detail: props,
    bubbles: true,
  })
}