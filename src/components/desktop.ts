import {customElement, queryAssignedElements} from "lit/decorators.js";
import {css, html, LitElement} from "lit";
import {EpkIcon} from "./icon.ts";
import {DisallowFlags, type Launch} from "../lib/events.ts";
import {EpkWindow} from "./window.ts";
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
      gap: 8px;
    }
  `

  @queryAssignedElements({slot: 'icons'})
  icons!: EpkIcon[]

  @queryAssignedElements({slot: 'windows'})
  windows!: EpkWindow[]

  appInstanceCount = new Map<string, number>()

  firstUpdated() {
    this.addEventListener('launch', this.handleLaunch)
    this.addEventListener('active-window-change', this.handleActiveWindowChange)
    this.addEventListener('close-window', this.handleCloseWindow)
  }

  handleClick(event: Event) {
    this.icons?.filter(i => i !== event.target).forEach(i => i.selected = false)

    this.windows?.forEach(w => {
      if ((w === event.target || (event.target instanceof Node && w.contains(event.target)))) {
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

  private getSortedWindows(event: Event) {
    return this.windows
      ?.filter(w => w !== event.target)
      .toSorted((a, b) => parseInt(a.style.zIndex) - parseInt(b.style.zIndex))
  }

  handleActiveWindowChange(event: Event) {
    this.getSortedWindows(event)
      ?.forEach((w, index) => {
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

      if (launchData.windowDimensions === 'fullscreen') {
        app.slot = 'fullscreen'
        this.append(app)
      } else {
        const epkWindow = new EpkWindow()

        const appLastPosition = app.doNotTrackLastPosition ? {
          x: null,
          y: null,
          height: null,
          width: null,
        } : EpkWindow.lastAppPositions.get(appName)

        epkWindow.slot = 'windows'
        epkWindow.title = app.windowTitle

        if (app.windowIcon) {
          epkWindow.thumbnail = app.windowIcon
        }

        epkWindow.noHorizontalResize = (launchData.disallowFlags & DisallowFlags.DisallowHorizontalResize) > 0
        epkWindow.noVerticalResize = (launchData.disallowFlags & DisallowFlags.DisallowVerticalResize) > 0
        epkWindow.noFullscreen = (launchData.disallowFlags & DisallowFlags.DisallowMaximize) > 0
        epkWindow.noMinimize = (launchData.disallowFlags & DisallowFlags.DisallowMinimize) > 0

        const [lastWidth, lastHeight] = [appLastPosition?.width, appLastPosition?.height]
        const [minWidth, minHeight] = app.getMinimumDimensions()
        const [eventWidth, eventHeight] = launchData.windowDimensions

        let [widthToUse, heightToUse] = [
          lastWidth || eventWidth || minWidth,
          lastHeight || eventHeight || minHeight
        ]

        epkWindow.minWidth = minWidth
        epkWindow.minHeight = minHeight
        epkWindow.width = widthToUse
        epkWindow.height = heightToUse

        const position = launchData.position

        if (position !== 'center') {
          epkWindow.x = appLastPosition?.x || (position[0] as number) || 0
          epkWindow.y = appLastPosition?.y || (position[1] as number) || 0

          if (instanceCount > 0) {
            epkWindow.x += 16
            epkWindow.y += 16
          }
        }

        epkWindow.append(app)
        this.append(epkWindow)
      }
    })
  }

  render() {
    return html`
      <main @click="${this.handleClick}">
        <div class="icon-container">
          <slot name="icons"></slot>
        </div>
        <slot name="windows"></slot>
        <slot name="fullscreen"></slot>
      </main>
    `
  }
}