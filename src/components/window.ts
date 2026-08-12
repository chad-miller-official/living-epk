import {customElement, property, query, queryAssignedElements, state} from "lit/decorators.js";
import {css, html, LitElement, unsafeCSS} from "lit";
import interact from "interactjs";
import type {Interactable, InteractEvent} from "@interactjs/types";
import {styleMap} from "lit/directives/style-map.js";
import type {ResizeEvent} from "@interactjs/actions/resize/plugin";
import {activeWindowChangeEvent} from "../lib/events.ts";

import xpStyle from 'xp.css/dist/XP.css?inline'
import type {EpkToolbar} from "./toolbar.ts";

@customElement('epk-window')
export class EpkWindow extends LitElement {
  private static instanceCount = 0

  static styles = [
    unsafeCSS(xpStyle),
    css`
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

      #toolbar {
        margin: 0 3px;
      }

      .window {
        display: flex;
        flex-direction: column;
        position: fixed;

        &.fullscreen {
          border-top-left-radius: 0;
          border-top-right-radius: 0;
          box-shadow: initial;

          & #statusBar {
            margin: 0;
          }

          & .title-bar {
            border-top-left-radius: 0;
            border-top-right-radius: 0;
            padding-right: 2px;
          }

          & #toolbar {
            margin: 0;
          }
        }
      }

      .window-body {
        flex-grow: 1;
        margin: 0 3px;
      }

      .window-viewport {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }
    `]

  @query('.window')
  window: HTMLElement | undefined

  @queryAssignedElements()
  windowBody: HTMLElement[] | undefined

  @queryAssignedElements({slot: 'toolbar'})
  toolbar: EpkToolbar[] | undefined

  @property({type: String})
  title = "Untitled Window"

  @property({type: String})
  thumbnail = ''

  @property({type: Number})
  x = 0

  @property({type: Number})
  y = 0

  @property({type: Number})
  width: number | null = null

  @property({type: Number})
  height: number | null = null

  @property({type: Number})
  minWidth: number | null = null

  @property({type: Number})
  minHeight: number | null = null

  @property({type: String})
  backgroundColor: string | undefined

  @state()
  active = true

  @state()
  fullscreen = false

  @state()
  minimized = false

  private interact: Interactable | null = null;

  private maximizeWindow() {
    this.style.top = '0'
    this.style.left = '0'
  }

  private restoreWindow() {
    this.style.top = 'initial'
    this.style.left = 'initial'
  }

  private resetCoordinates(overrideX?: string, overrideY?: string) {
    const useX = overrideX || `${this.x}px`
    const useY = overrideY || `${this.y}px`

    this.style.transform = `translate(${useX}, ${useY})`
  }

  private resetDimensions(overrideHeight?: string, overrideWidth?: string) {
    this.style.height = overrideHeight || `${this.height}px`
    this.style.width = overrideWidth || `${this.width}px`
  }

  firstUpdated() {
    const epkWindow = this.shadowRoot?.querySelector('.window') as HTMLDivElement

    if (epkWindow) {
      const bodyStyle = window.getComputedStyle(this.window!)
      const minWidth = this.minWidth || parseInt(bodyStyle.width.replace('px$', ''))
      const minHeight = this.minHeight || parseInt(bodyStyle.height.replace('px$', ''))

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
                width: minWidth,
                height: minHeight,
              }
            })
          ]
        })
    }

    this.resetDimensions()
    this.setActive()

    this.style.transform = `translate(${this.x}px, ${this.y}px)`
    EpkWindow.instanceCount++
  }

  disconnectedCallback() {
    super.disconnectedCallback()

    if (this.interact) {
      this.interact.unset()
    }

    EpkWindow.instanceCount--
  }

  setActive() {
    this.active = true
    this.style.zIndex = EpkWindow.instanceCount.toString()
    this.dispatchEvent(activeWindowChangeEvent())
  }

  handleClick() {
    this.setActive()
  }

  handleDblClick() {
    this.toggleFullscreen()
  }

  handleDrag(event: InteractEvent) {
    if (this.fullscreen) {
      return
    }

    this.x += event.dx
    this.y += event.dy

    this.style.transform = `translate(${this.x}px, ${this.y}px)`
    this.setActive()
  }

  handleResize(event: ResizeEvent) {
    if (this.fullscreen) {
      return
    }

    this.x += event.deltaRect!.left
    this.y += event.deltaRect!.top

    this.width = event.rect.width
    this.height = event.rect.height

    this.resetCoordinates()
    this.resetDimensions()
    this.setActive()
  }

  handleClose() {
    this.remove()
  }

  toggleFullscreen() {
    this.fullscreen = !this.fullscreen
    this.minimized = false

    if (this.fullscreen) {
      this.resetCoordinates('0', '0')
      this.resetDimensions('100vh', '100vw')
      this.maximizeWindow()
    } else {
      this.resetCoordinates()
      this.resetDimensions()
      this.restoreWindow()
    }
  }

  toggleMinimized() {
    this.minimized = !this.minimized
    this.fullscreen = false

    if (this.minimized) {
      this.resetCoordinates()
      this.resetDimensions()
      this.restoreWindow()
    } else {
      this.resetDimensions()
    }
  }

  render() {
    const windowStyle: any = {
      height: this.fullscreen ? '100vh' : this.minimized ? 'auto' : `${this.height}px`,
      width: this.fullscreen ? '100vw' : `${this.width}px`,
      opacity: this.active ? 1 : 0.7,
    }

    if (this.fullscreen) {
      windowStyle.top = 0
      windowStyle.left = 0
    }

    const viewportStyle: any = {}

    if (this.minimized) {
      viewportStyle.display = 'none'
    }

    const iconStyle = {backgroundImage: `url(${this.thumbnail})`}

    let windowClass = 'window'

    if (this.fullscreen) {
      windowClass += ' fullscreen'
    }

    const bodyStyle: any = {}

    if (this.backgroundColor) {
      bodyStyle['backgroundColor'] = this.backgroundColor
    }

    const hasStatusBar = this.querySelector('[slot="status-bar"]') != null

    return html`
      <div class="${windowClass}" style="${styleMap(windowStyle)}" @click="${this.handleClick}">
        <div class="title-bar" @dblclick="${this.handleDblClick}">
          <div class="title-bar-text">
            <div class="title-bar-icon" style="${styleMap(iconStyle)}"></div>
            ${this.title}
          </div>
          <div class="title-bar-controls">
            <button aria-label="Minimize" @click="${this.toggleMinimized}"></button>
            <button aria-label="${this.fullscreen ? 'Restore' : 'Maximize'}"
                    @click="${this.toggleFullscreen}"></button>
            <button aria-label="Close" @click="${this.handleClose}"></button>
          </div>
        </div>
        <div class="window-viewport" style="${styleMap(viewportStyle)}">
          <div id="toolbar">
            <slot name="toolbar"></slot>
          </div>
          <div class="window-body" style="${styleMap(bodyStyle)}">
            <slot></slot>
          </div>
          <div id="statusBar" class="status-bar" style="${styleMap({ display: hasStatusBar ? 'flex' : 'none'})}">
            <slot name="status-bar"></slot>
          </div>
        </div>
      </div>
    `
  }
}