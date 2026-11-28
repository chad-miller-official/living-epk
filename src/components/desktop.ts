import {customElement, queryAssignedElements} from "lit/decorators.js";
import {css, html, LitElement} from "lit";
import {EpkIcon} from "./icon.ts";
import {
  ACTIVE_WINDOW_CHANGE_EVENT,
  CLOSE_WINDOW_EVENT,
  FILE_PICKED_EVENT,
  type FilePicked,
  type Launch,
  LAUNCH_EVENT
} from "../lib/events.ts";
import {EpkWindow, WindowRestriction} from "./window.ts";
import {EpkApp} from "./app.ts";
import type {FilePickedHandler} from "./apps/dialog/file-picker.ts";

@customElement('epk-desktop')
export class EpkDesktop extends LitElement {
  static styles = css`
    .desktop {
      align-items: flex-start;
      background-image: url("/img/bliss.jpg");
      background-position: center;
      background-size: cover;
      display: flex;
      flex-direction: column;
      gap: 16px;
      height: 100vh;
      width: 100vw;
    }

    slot[name=icons] {
      align-items: center;
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;
      max-height: 100%;
      row-gap: 8px;
    }`

  @queryAssignedElements({slot: 'icons'})
  icons!: EpkIcon[]

  @queryAssignedElements({slot: 'windows'})
  windows!: EpkWindow[]

  private appInstanceCount = new Map<string, number>()

  firstUpdated() {
    this.addEventListener(ACTIVE_WINDOW_CHANGE_EVENT, this.handleActiveWindowChange)
    this.addEventListener(CLOSE_WINDOW_EVENT, this.handleCloseWindow)
    this.addEventListener(FILE_PICKED_EVENT, this.handleFilePicked)
    this.addEventListener(LAUNCH_EVENT, this.handleLaunch)
  }

  private getWindowByAppId(appId: string): EpkWindow | undefined {
    return this.windows.find(w => w.getApp().getAppId() === appId)
  }

  private handleActiveWindowChange(event: Event): void {
    const targetAppId = (event as CustomEvent).detail?.targetAppId
    let targetWindow: EpkWindow | undefined

    if (targetAppId) {
      targetWindow = this.getWindowByAppId(targetAppId)
    }

    if (!targetWindow) {
      const target = event.target as Element
      targetWindow = (target.classList.contains('epk-app') ? target.parentElement : target) as EpkWindow
    }

    targetWindow.active = true
    targetWindow.style.zIndex = EpkWindow.instanceCount.toString()

    this.windows
      .filter(w => w !== targetWindow)
      .toSorted((a, b) => parseInt(a.style.zIndex) - parseInt(b.style.zIndex))
      .forEach((w, index) => {
        w.active = false
        w.style.zIndex = index.toString()
      })
  }

  private handleCloseWindow(event: Event): void {
    let appName: string

    if (event.target instanceof EpkWindow) {
      appName = (event.target as EpkWindow).getApp().constructor.name
    } else if (event.target instanceof EpkApp) {
      appName = (event.target as EpkApp).constructor.name
    } else {
      return
    }

    const instanceCount = this.appInstanceCount.get(appName)!
    this.appInstanceCount.set(appName, instanceCount - 1)
  }

  private handleLaunch(event: Event): void {
    const launchData = (event as CustomEvent<Launch>).detail

    const app = launchData.init()
    app.classList.add('epk-app')

    const appName = app.constructor.name
    const instanceCount = this.appInstanceCount.get(appName) || 0
    this.appInstanceCount.set(appName, instanceCount + 1)

    const epkWindow = new EpkWindow()
    epkWindow.slot = 'windows'
    epkWindow.title = app.windowTitle
    epkWindow.disallowFlags = launchData.disallowFlags || WindowRestriction.AllowAll

    if (app.windowIcon) {
      epkWindow.thumbnail = app.windowIcon
    }

    const positionTrackingName = app.getPositionTrackingName()

    const appLastPosition = positionTrackingName
      ? EpkWindow.lastAppPositions.get(positionTrackingName)
      : null

    const lastSize = appLastPosition?.size
    const eventSize = launchData.size
    const minSize = app.getMinimumDimensions()

    epkWindow.size = {
      width: lastSize?.width || eventSize?.width || minSize.width,
      height: lastSize?.height || eventSize?.height || minSize.height,
    }

    epkWindow.minSize = minSize
    const location = launchData.location

    if (location !== 'center') {
      epkWindow.location = {
        x: (appLastPosition?.location.x || location?.x || 0) + (instanceCount > 0 ? 16 : 0),
        y: (appLastPosition?.location.y || location?.y || 0) + (instanceCount > 0 ? 16 : 0),
      }
    }

    epkWindow.append(app)
    this.append(epkWindow)
  }

  private handleFilePicked(event: Event): void {
    const detail = (event as CustomEvent<FilePicked>).detail
    const app = this.getWindowByAppId(detail.targetAppId)?.getApp() as unknown as FilePickedHandler
    app.handleFilePicked(detail.fileLinkNode)
  }

  private handleClick(event: Event): void {
    this.icons?.filter(i => i !== event.target).forEach(i => i.deselect())

    this.windows?.forEach(w => {
      if ((w === event.target || w.contains(event.target as Node))) {
        w.active = true
      } else {
        w.active = false
        const app = w.getApp()

        if (event.target instanceof EpkIcon) {
          app.getContainedIcons()
            .filter(i => i !== event.target)
            .forEach(i => i.deselect())
        }

        if (event.target !== app) {
          app.toolbar?.closeAll()
        }
      }
    })
  }

  render() {
    return html`
      <div class="desktop" @click="${this.handleClick}">
        <slot name="icons"></slot>
        <slot name="windows"></slot>
      </div>`
  }
}