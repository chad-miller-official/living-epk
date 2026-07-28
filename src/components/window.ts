import {customElement, property, state} from "lit/decorators.js";
import {css, html, LitElement} from "lit";
import interact from "interactjs";
import type {Interactable} from "@interactjs/types";
import type {InteractEvent} from "@interactjs/types/index";
import {styleMap} from "lit/directives/style-map.js";
import type {ResizeEvent} from "@interactjs/actions/resize/plugin";

@customElement('epk-window')
export class EpkWindow extends LitElement {
  static styles = css`
    .title-bar {
      user-select: none;

      &:hover {
        cursor: default;
      }
    }

    .title-bar-icon {
      height: 16px;
      width: 16px;
    }

    .title-bar-text {
      align-items: center;
      display: flex;
      gap: 1ch;
    }

    .window-body {
      height: calc(100% - 28px - 8px - 8px);
    }
  `

  protected static windowCount = 0

  @property({type: String})
  title = "Untitled Window"

  @property({type: String})
  thumbnail = ''

  @state()
  x = 0

  @state()
  y = 0

  @state()
  width = 256

  @state()
  height = 256

  @state()
  fullscreen = false

  @state()
  minimized = false

  private interact: Interactable | null = null;

  constructor() {
    super()

    this.tabIndex = -1
    this.style.zIndex = EpkWindow.windowCount.toString()

    EpkWindow.windowCount++

    this.addEventListener('click', () => this.focus())
    this.addEventListener('focus', this.handleFocus)
  }

  private getSortedWindows(): EpkWindow[] {
    return Array.from(document.querySelectorAll('epk-window'))
      .filter(epkWindow => epkWindow !== this)
      .sort((a, b) => parseInt((a as EpkWindow).style.zIndex) - parseInt((b as EpkWindow).style.zIndex))
      .map(elem => elem as EpkWindow)
  }

  handleFocus() {
    this.getSortedWindows().forEach((epkWindow, idx) => {
      epkWindow.style.opacity = '0.5'
      epkWindow.style.zIndex = idx.toString()
    })

    this.style.opacity = '1'
    this.style.zIndex = EpkWindow.windowCount.toString()
  }

  handleDrag(event: InteractEvent) {
    this.x += event.dx
    this.y += event.dy
  }

  handleResize(event: ResizeEvent) {
    if (this.fullscreen) {
      return
    }

    this.x += event.deltaRect!.left
    this.y += event.deltaRect!.top

    this.width = event.rect.width
    this.height = event.rect.height
  }

  firstUpdated() {
    const epkWindow = this.shadowRoot?.querySelector('.window') as HTMLDivElement

    if (epkWindow) {
      this.interact = interact(epkWindow)

      this.interact
        .draggable({
          allowFrom: '.title-bar',
          listeners: {move: this.handleDrag.bind(this)},
        })
        .resizable({
          edges: {
            top: false,
            right: true,
            bottom: true,
            left: true,
          },
          listeners: {move: this.handleResize.bind(this)},
          modifiers: [
            interact.modifiers.restrictSize({
              min: {
                width: 256,
                height: 256,
              }
            })
          ]
        })
    }
  }

  handleClose() {
    this.getSortedWindows().at(-1)?.focus()
    this.remove()
  }

  disconnectedCallback() {
    super.disconnectedCallback()

    if (this.interact) {
      this.interact.unset()
    }

    EpkWindow.windowCount--
  }

  toggleFullscreen() {
    this.fullscreen = !this.fullscreen
    this.minimized = false
  }

  toggleMinimized() {
    this.minimized = !this.minimized
    this.fullscreen = false
  }

  render() {
    const windowStyle: any = {
      transform: undefined,
      height: undefined,
      width: undefined,
    }

    if (this.fullscreen) {
      windowStyle.transform = `translate(0, 0)`
      windowStyle.height = '100dvh'
      windowStyle.width = '100vw'

      windowStyle.position = 'fixed'
      windowStyle.top = 0
      windowStyle.left = 0
    } else {
      windowStyle.transform = `translate(${this.x}px, ${this.y}px)`
      windowStyle.height = `${this.height}px`
      windowStyle.width = `${this.width}px`
    }

    const iconStyle = {backgroundImage: `url(${this.thumbnail})`}
    const bodyStyle: any = {}

    if (this.minimized) {
      windowStyle.height = '28px'
      bodyStyle.display = 'none'
    }

    return html`
      <link rel="stylesheet" href="https://unpkg.com/XP.css"/>
      <div class="window" style="${styleMap(windowStyle)}">
        <div class="title-bar">
          <div class="title-bar-text">
            <div class="title-bar-icon" style="${styleMap(iconStyle)}"></div>
            ${this.title}
          </div>
          <div class="title-bar-controls">
            <button aria-label="Minimize" @click="${this.toggleMinimized}"></button>
            <button aria-label="${this.fullscreen ? 'Restore' : 'Maximize'}" @click="${this.toggleFullscreen}"></button>
            <button aria-label="Close" @click="${this.handleClose}"></button>
          </div>
        </div>
        <div class="window-body" style="${styleMap(bodyStyle)}">
          <slot></slot>
        </div>
      </div>
    `
  }
}