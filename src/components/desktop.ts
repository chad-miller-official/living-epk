import {customElement, queryAssignedElements} from "lit/decorators.js";
import {css, html, LitElement} from "lit";
import {EpkIcon} from "./icon.ts";
import {
  ACTIVE_WINDOW_CHANGE_EVENT,
  CLOSE_WINDOW_EVENT, FILE_PICKED_EVENT,
  type FilePicked,
  type Launch,
  LAUNCH_EVENT
} from "../lib/events.ts";
import {DisallowFlags, EpkWindow} from "./window.ts";
import {EpkApp} from "./app.ts";

@customElement('epk-desktop')
export class EpkDesktop extends LitElement {
  static styles = css`
    main {
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

    .icon-container {
      align-items: center;
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;
      max-height: 100%;
      row-gap: 8px;
    }
  `

  @queryAssignedElements({slot: 'icons'})
  icons!: EpkIcon[]

  @queryAssignedElements({slot: 'windows'})
  windows!: EpkWindow[]

  appInstanceCount = new Map<string, number>()

  firstUpdated() {
    this.addEventListener(LAUNCH_EVENT, this.handleLaunch)
    this.addEventListener(ACTIVE_WINDOW_CHANGE_EVENT, this.handleActiveWindowChange)
    this.addEventListener(CLOSE_WINDOW_EVENT, this.handleCloseWindow)
    this.addEventListener(FILE_PICKED_EVENT, this.handleFilePicked)
  }

  handleFilePicked(event: Event) {
    const detail = (event as CustomEvent<FilePicked>).detail
    this.getWindowByAppId(detail.targetAppId)?.app[0].handleFilePicked(detail.fileLinkNode)
  }

  getWindowByAppId(appId: string) {
    return this.windows.find(w => w.app[0].getAppId() === appId)
  }

  handleClick(event: Event) {
    this.icons?.filter(i => i !== event.target).forEach(i => i.selected = false)

    this.windows?.forEach(w => {
      if ((w === event.target || (event.target instanceof Node && w.contains(event.target)))) {
        w.active = true
        return
      } else {
        w.active = false
      }

      let allChildren: Element[] = []
      const children = w.app[0].querySelectorAll('.epk-icon')

      if (children) {
        allChildren = allChildren.concat(Array.from(children))
      }

      const shadowChildren = w.app[0].shadowRoot?.querySelectorAll('.epk-icon')

      if (shadowChildren) {
        allChildren = allChildren.concat(Array.from(shadowChildren))
      }

      allChildren
        .filter(elem => elem !== event.target)
        .forEach(elem => (elem as EpkIcon).selected = false)

      if (event.target !== w.app[0]) {
        w.app[0].toolbar?.closeAll()
      }
    })
  }

  handleActiveWindowChange(event: Event) {
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

  handleCloseWindow(event: Event) {
    let appName: string

    if (event.target instanceof EpkWindow) {
      appName = (event.target as EpkWindow).app[0].constructor.name
    } else if (event.target instanceof EpkApp) {
      appName = (event.target as EpkApp).constructor.name
    } else {
      return
    }

    const instanceCount = this.appInstanceCount.get(appName)!
    this.appInstanceCount.set(appName, instanceCount - 1)
  }

  handleLaunch(event: Event) {
    const launchData = (event as CustomEvent<Launch>).detail

    launchData.init().then(app => {
      const appName = app.constructor.name
      app.classList.add('epk-app')

      const instanceCount = this.appInstanceCount.get(appName) || 0
      this.appInstanceCount.set(appName, instanceCount + 1)

      const epkWindow = new EpkWindow()

      const appLastPosition = app.doNotTrackLastPosition
        ? null
        : EpkWindow.lastAppPositions.get(app.getPositionTrackingName())

      epkWindow.slot = 'windows'
      epkWindow.title = app.windowTitle

      if (app.windowIcon) {
        epkWindow.thumbnail = app.windowIcon
      }

      epkWindow.disallowFlags = launchData.disallowFlags || DisallowFlags.AllowAll

      const [lastWidth, lastHeight] = [appLastPosition?.size.width, appLastPosition?.size.height]
      const [eventWidth, eventHeight] = [launchData.size?.width, launchData.size?.height]
      const minSize = app.getMinimumDimensions()

      let [widthToUse, heightToUse] = [
        lastWidth || eventWidth || minSize.width,
        lastHeight || eventHeight || minSize.height,
      ]

      epkWindow.minSize = {}

      if (minSize.width) {
        epkWindow.minSize.width = minSize.width
      }

      if (minSize.height) {
        epkWindow.minSize.height = minSize.height
      }

      epkWindow.size = {width: widthToUse!, height: heightToUse!}

      const location = launchData.location

      if (location !== 'center') {
        epkWindow.location = {
          x: (appLastPosition?.location.x || location?.x || 0) + (instanceCount > 0 ? 16 : 0),
          y: (appLastPosition?.location.y || location?.y || 0) + (instanceCount > 0 ? 16 : 0),
        }
      }

      epkWindow.append(app)
      this.append(epkWindow)
    })
  }

  render() {
    return html`
      <main @click="${this.handleClick}">
        <div class="icon-container">
          <slot name="icons"></slot>
        </div>
        <slot name="windows"></slot>
      </main>`
  }
}