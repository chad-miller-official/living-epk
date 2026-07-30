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
      w.windowBody?.forEach(wb => {
        if (wb instanceof EpkIconList) {
          (wb as EpkIconList).icons?.filter(i => i !== event.target).forEach(i => i.selected = false)
        }
      })
    });
  }

  handleActiveWindowChange(event: Event) {
    const inactive: EpkWindow[] = []
    const active: EpkWindow[] = []

    this.windows?.toSorted((a, b) => parseInt(a.style.zIndex) - parseInt(b.style.zIndex)).forEach(w => {
      w.active = (w === event.target || (event.target instanceof Node && w.contains(event.target)))
      w.active ? active.push(w) : inactive.push(w)
    });

    [...inactive, ...active].forEach((w, index) => w.style.zIndex = index.toString())
  }

  handleLaunch(event: Event) {
    const epkWindow = (event as CustomEvent<Launch>).detail.init()
    epkWindow.slot = 'windows'
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