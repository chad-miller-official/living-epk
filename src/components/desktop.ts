import {customElement, queryAssignedElements} from "lit/decorators.js";
import {css, html, LitElement} from "lit";
import {EpkIcon} from "./icon.ts";
import {type Launch} from "../lib/events.ts";
import {EpkWindow} from "./window.ts";
import {EpkIconList} from "./icon-list.ts";

@customElement('epk-desktop')
export class EpkDesktop extends LitElement {
  static styles = css`
    main {
      align-items: flex-start;
      background-image: url("/img/Coffee_Bean.webp");
      background-repeat: repeat;
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
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
      } else {
        w.active = false
      }

      w.windowBody?.forEach(wb => {
        if (wb instanceof EpkIconList) {
          (wb as EpkIconList).icons?.filter(i => i !== event.target).forEach(i => i.selected = false)
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
    const app = (event as CustomEvent<Launch>).detail.init()
    const toolbarItems = app.getToolbarItems()

    toolbarItems.forEach(item => {
      item.slot = 'toolbar'
      item.classList.add('toolbar-item')
    })

    const statusBarItems = app.getStatusBarItems()

    statusBarItems.forEach(item => {
      item.slot = 'status-bar'
      item.classList.add('status-bar-field')
    })

    const minimumDimensions = app.getMinimumDimensions()

    const epkWindow = new EpkWindow()
    epkWindow.title = app.windowTitle
    epkWindow.thumbnail = app.windowIcon
    epkWindow.append(...toolbarItems, ...app.getWindowContents(), ...statusBarItems)
    epkWindow.slot = 'windows';

    [epkWindow.width, epkWindow.height] = minimumDimensions

    this.appendChild(epkWindow)
  }

  render() {
    return html`
      <main @click="${this.handleClick}">
        <slot name="icons"></slot>
        <slot name="windows"></slot>
      </main>
    `
  }
}