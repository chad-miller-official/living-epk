import {customElement, property, query, queryAssignedElements, state} from "lit/decorators.js";
import {css, html, LitElement, nothing, unsafeCSS} from "lit";
import interact from "interactjs";
import type {Interactable, InteractEvent} from "@interactjs/types";
import {styleMap} from "lit/directives/style-map.js";
import type {ResizeEvent} from "@interactjs/actions/resize/plugin";
import {activeWindowChangeEvent, closeWindowEvent, type WindowProperties} from "../lib/events.ts";

import xpStyle from 'xp.css/dist/XP.css?inline'
import type {EpkApp} from "./app.ts";

type WindowPosition = {
  x: number,
  y: number,
  width: number,
  height: number,
}

@customElement('epk-window')
export class EpkWindow extends LitElement {
  private static instanceCount = 0
  static lastAppPositions = new Map<string, WindowPosition>()

  static styles = [
    unsafeCSS(xpStyle),
    css`
      .title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .title-bar {
        user-select: none;

        &:hover {
          cursor: default;
        }
      }

      .title-bar-icon {
        flex-shrink: 0;
        height: 16px;
        width: 16px;
      }

      .title-bar-text {
        align-items: center;
        display: flex;
        gap: 1ch;
        min-width: 0;
      }

      .window-wrapper {
        height: 100%;
        padding: 6px 6px 9px 6px;
        width: 100%;
      }

      .window {
        display: flex;
        flex-direction: column;
        opacity: 0.9;
        position: fixed;
        user-select: none;

        &.active {
          opacity: 1;
          user-select: revert;
        }

        &.fullscreen {
          border-top-left-radius: 0;
          border-top-right-radius: 0;
          box-shadow: initial;
          height: 100vh;
          left: 0;
          top: 0;
          width: 100vw;

          & .title-bar {
            border-top-left-radius: 0;
            border-top-right-radius: 0;
            padding-right: 2px;
          }

          & .window-viewport {
            margin: 0 -3px;
          }
        }

        &.minimized {
          height: auto;
        }
      }

      .window-viewport {
        flex-grow: 1;

        &.minimized {
          display: none;
        }
      }
    `]

  @query('.window')
  window!: HTMLElement

  @queryAssignedElements({selector: '.epk-app'})
  app!: EpkApp[]

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

  @property({type: Boolean})
  noHorizontalResize = false

  @property({type: Boolean})
  noVerticalResize = false

  @property({type: Boolean})
  noMinimize = false

  @property({type: Boolean})
  noFullscreen = false

  @state()
  active = true

  @state()
  fullscreen = false

  @state()
  minimized = false

  private interact: Interactable | null = null

  /*
   * When closing a Window, two events are triggered:
   *
   * 1. click (which itself triggers an active-window-change event)
   * 2. close-window
   *
   * However, the click event is handled AFTER the close-window event. So we run into a problem: the
   * Desktop handles the click and tries to make the window that we just closed "active".
   *
   * So this flag mitigates this: when a Window is closed, `isClosing` is set to true, and then in
   * the click handler, we can check `isClosing` to conditionally stop the click event's
   * propagation, preventing the event from reaching the Desktop's click handler and messing up our
   * active window ordering.
   */
  private isClosing = false

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
    this.addEventListener('close-window', this.handleCloseWindow)
    this.addEventListener('window-property-change', this.handleWindowPropertyChange)

    const epkWindow = this.shadowRoot?.querySelector('.window-wrapper') as HTMLDivElement

    if (epkWindow) {
      const bodyStyle = window.getComputedStyle(this.window!)
      const minWidth = this.minWidth || parseInt(bodyStyle.width.replace(/px$/, ''))
      const minHeight = this.minHeight || parseInt(bodyStyle.height.replace(/px$/, ''))

      this.interact = interact(epkWindow)

      this.interact.draggable({
        allowFrom: '.title-bar',
        listeners: {move: this.handleDrag.bind(this)},
      })

      if (!(this.noHorizontalResize && this.noVerticalResize)) {
        this.interact.resizable({
          edges: {
            top: false,
            right: !this.noVerticalResize,
            bottom: !this.noHorizontalResize,
            left: !this.noVerticalResize,
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
    }

    this.resetDimensions()
    this.setActive()
    this.updateLastPosition()

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

  handleCloseWindow() {
    this.remove()
    this.isClosing = true
  }

  handleWindowPropertyChange(event: Event) {
    const detail = (event as CustomEvent<WindowProperties>).detail

    if (detail.title) {
      this.title = detail.title
    }
  }

  setActive() {
    this.active = true
    this.style.zIndex = EpkWindow.instanceCount.toString()
    this.dispatchEvent(activeWindowChangeEvent())
  }

  handleClick(event: Event) {
    if (this.isClosing) {
      event.stopPropagation()
    } else {
      this.setActive()
    }
  }

  handleDblClick() {
    this.toggleFullscreen()
  }

  updateLastPosition() {
    const containedAppName = this.app[0].constructor.name

    if (containedAppName) {
      EpkWindow.lastAppPositions.set(containedAppName, {
        x: this.x,
        y: this.y,
        width: this.width!,
        height: this.height!,
      })
    }
  }

  handleDrag(event: InteractEvent) {
    if (this.fullscreen) {
      return
    }

    this.x += event.dx
    this.y += event.dy

    this.style.transform = `translate(${this.x}px, ${this.y}px)`
    this.setActive()

    this.updateLastPosition()
  }

  handleResize(event: ResizeEvent) {
    if (this.fullscreen || this.minimized) {
      return
    }

    if (event.axes?.includes('x')) {
      this.x += event.deltaRect!.left
      this.width = event.rect.width - 12
    }

    if (event.axes?.includes('y')) {
      this.y += event.deltaRect!.top
      this.height = event.rect.height - 15
    }

    this.resetCoordinates()
    this.resetDimensions()
    this.setActive()

    this.updateLastPosition()
  }

  toggleFullscreen() {
    if (this.noFullscreen) {
      return
    }

    if (this.minimized) {
      this.resetDimensions(`${this.height}px`)
    } else {
      this.fullscreen = !this.fullscreen

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

    this.minimized = false
  }

  toggleMinimized() {
    if (this.noMinimize) {
      return
    }

    this.minimized = !this.minimized
    this.fullscreen = false

    if (this.minimized) {
      this.resetCoordinates()
      this.resetDimensions('28px')
      this.restoreWindow()
    } else {
      this.resetDimensions(`${this.height}px`)
    }
  }

  render() {
    let windowClass = 'window'

    if (this.active) {
      windowClass += ' active'
    }

    let viewportClass = 'window-viewport'
    const windowStyle: any = {}

    if (this.fullscreen) {
      windowClass += ' fullscreen'
    } else {
      if (this.minimized) {
        windowClass += ' minimized'
        viewportClass += ' minimized'
      } else {
        windowStyle['height'] = `${this.height}px`
      }

      windowStyle['width'] = `${this.width}px`
    }

    const iconStyle = {'backgroundImage': `url(${this.thumbnail})`}

    return html`
      <div class="window-wrapper">
        <div class="${windowClass}" style="${styleMap(windowStyle)}" @click="${this.handleClick}">
          <div class="title-bar" @dblclick="${this.handleDblClick}">
            <div class="title-bar-text">
              ${this.thumbnail ? html`
                <div class="title-bar-icon" style="${styleMap(iconStyle)}"></div>` : nothing}
              <div class="title">${this.title}</div>
            </div>
            <div class="title-bar-controls">
              ${this.noMinimize ? nothing : html`
                <button aria-label="Minimize" @click="${this.toggleMinimized}"></button>`}
              ${this.noFullscreen ? nothing : html`
                <button aria-label="${this.fullscreen ? 'Restore' : 'Maximize'}"
                        @click="${this.toggleFullscreen}"></button>`}
              <button aria-label="Close"
                      @click="${() => this.dispatchEvent(closeWindowEvent())}"></button>
            </div>
          </div>
          <div class="${viewportClass}">
            <slot></slot>
          </div>
        </div>
      </div>
    `
  }
}