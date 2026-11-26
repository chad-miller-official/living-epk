import type {EpkApp} from "../components/app.ts";
import type {LinkNode} from "./fs.ts";
import type {EpkWindow} from "../components/window.ts";
import type {Dimensions, Point} from "@interactjs/core/types";

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
  return new CustomEvent<Launch>('launch', {
    detail: {
      init: appInit,
      ...launchOptions
    },
    bubbles: true,
    composed: true,
  })
}

export type ActiveWindowChange = { targetAppId?: string }

export function activeWindowChangeEvent(targetAppId?: string): CustomEvent<ActiveWindowChange> {
  return new CustomEvent<ActiveWindowChange>('active-window-change', {
    detail: {targetAppId},
    bubbles: true,
  })
}

export function closeWindowEvent(): CustomEvent {
  return new CustomEvent('close-window', {bubbles: true})
}

export type WindowProperties = Partial<Pick<EpkWindow, 'title' | 'size' | 'disallowFlags' | 'state'>>

export function windowPropertyChangeEvent(props: WindowProperties): CustomEvent<WindowProperties> {
  return new CustomEvent<WindowProperties>('window-property-change', {
    detail: props,
    bubbles: true,
  })
}

export type FilePicked = {
  targetAppId: string,
  fileLinkNode?: LinkNode,
}

export function filePickedEvent(props: FilePicked): CustomEvent<FilePicked> {
  return new CustomEvent<FilePicked>('file-picked', {
    detail: props,
    bubbles: true,
  })
}