import {customElement, queryAssignedElements} from "lit/decorators.js";
import {css, html, LitElement} from "lit";
import {EpkIcon} from "./icon.ts";
import {type Launch} from "../lib/events.ts";
import {EpkWindow} from "./window.ts";
import {EpkToolbar} from "./ui.ts";

@customElement('epk-desktop')
export class EpkDesktop extends LitElement {
  static styles = css`
    main {
      align-items: flex-start;
      background-image: url("/img/Coffee_Bean.webp");
      background-repeat: repeat;
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
      gap: 16px;
    }
  `

  @queryAssignedElements({slot: 'icons'})
  icons: EpkIcon[] | undefined

  @queryAssignedElements({slot: 'windows'})
  windows: EpkWindow[] | undefined

  firstUpdated() {
    this.addEventListener('launch', this.handleLaunch)
    this.addEventListener('active-window-change', this.handleActiveWindowChange)
  }

  handleClick(event: Event) {
    this.icons?.filter(i => i !== event.target).forEach(i => i.selected = false)

    this.windows?.forEach(w => {
      if ((w === event.target || (event.target instanceof Node && w.contains(event.target)))) {
        w.setActive()
        return
      } else {
        w.active = false
      }

      w.content.forEach(wc => {
        const children = wc.querySelectorAll('.epk-icon')
        const shadowChildren = wc.shadowRoot?.querySelectorAll('.epk-icon')
        let allChildren = Array.from(children)

        if (shadowChildren) {
          allChildren = allChildren.concat(Array.from(shadowChildren))
        }

        allChildren
          .filter(elem => elem !== event.target)
          .forEach(elem => (elem as EpkIcon).selected = false)

        if (event.target !== wc) {
          (wc.shadowRoot?.querySelector('epk-toolbar') as EpkToolbar).closeAll()
        }
      })
    });
  }

  handleActiveWindowChange(event: Event) {
    this.windows
      ?.filter(w => w !== event.target)
      .toSorted((a, b) => parseInt(a.style.zIndex) - parseInt(b.style.zIndex))
      .forEach((w, index) => {
        w.active = false
        w.style.zIndex = index.toString()
      });
  }

  handleLaunch(event: Event) {
    const launchData = (event as CustomEvent<Launch>).detail

    const epkWindow = new EpkWindow()
    epkWindow.slot = 'windows'
    epkWindow.x = launchData.x || 0
    epkWindow.y = launchData.y || 0

    launchData.init().then(app => {
      epkWindow.title = app.windowTitle
      epkWindow.thumbnail = app.windowIcon

      const [minWidth, minHeight] = [256, 256]
      const [eventWidth, eventHeight] = launchData.windowDimensions

      let [widthToUse, heightToUse] = [eventWidth || minWidth, eventHeight || minHeight]

      if (eventWidth && minWidth && eventWidth < minWidth) {
        widthToUse = minWidth
      }

      if (eventHeight && minHeight && eventHeight < minHeight) {
        heightToUse = minHeight
      }

      epkWindow.minWidth = minWidth
      epkWindow.minHeight = minHeight
      epkWindow.width = widthToUse
      epkWindow.height = heightToUse

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
      </main>
    `
  }
}