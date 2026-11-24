import {customElement, property, query, queryAssignedElements, state} from "lit/decorators.js";
import {css, html, LitElement, nothing, unsafeCSS} from "lit";
import interact from "interactjs";
import type {Interactable, InteractEvent} from "@interactjs/types";
import {styleMap} from "lit/directives/style-map.js";
import type {ResizeEvent} from "@interactjs/actions/resize/plugin";
import {activeWindowChangeEvent, closeWindowEvent, DisallowFlags, type WindowProperties} from "../lib/events.ts";

import xpStyle from 'xp.css/dist/XP.css?inline'
import type {EpkApp} from "./app.ts";

type WindowPosition = {
  x: number,
  y: number,
  width: number,
  height: number,
}

enum WindowState {
  MINIMIZED,
  MAXIMIZED,
  FULLSCREEN,
}

@customElement('epk-window')
export class EpkWindow extends LitElement {
  private static instanceCount = 0
  static lastAppPositions = new Map<string, WindowPosition>()

  static styles = [
    unsafeCSS(xpStyle),
    css`
      .resizing {
        user-select: none;
      }

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
        background-size: contain;
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

      .window {
        display: flex;
        flex-direction: column;
        position: fixed;

        &:not(.active) {
          box-shadow: inset -1px -1px #5c659f,
          inset 1px 1px #6073c4,
          inset -2px -2px #5c6aa9,
          inset 2px 2px #647ecf,
          inset -3px -3px #5c74ca,
          inset 3px 3px #607ecb;

          user-select: none;

          & > .title-bar {
            filter: contrast(0.4) brightness(1.2);
          }
        }

        &.fullscreen {
          box-shadow: none;
          width: 100%;
        }

        &.maximized {
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
        }

        &.minimized {
          height: auto;
        }
      }

      .window-viewport {
        background-color: #eceadb;
        flex-grow: 1;
        margin: 0 auto;
        max-height: calc(100% - 28px);
        overflow: hidden;
        width: calc(100% - 6px);

        &.fullscreen {
          height: 100vh;
        }

        &.fullscreen, &.maximized {
          width: 100%;
        }

        &.maximized {
          height: 100%;
        }

        &.minimized {
          display: none;
        }
      }

      .window-wrapper {
        height: 100%;
        width: 100%;

        &:not(.fullscreen) {
          padding: 6px 6px 9px 6px;
        }
      }
    `]

  @query('.window')
  window!: HTMLElement

  @query('.window-wrapper')
  windowWrapper!: HTMLElement

  @queryAssignedElements({selector: '.epk-app'})
  app!: EpkApp[]

  @property({type: String})
  title = "Untitled Window"

  @property({type: String})
  thumbnail = ''

  @property()
  x?: number

  @property()
  y?: number

  @property()
  width?: number

  @property()
  height?: number

  @property()
  minWidth!: number

  @property()
  minHeight!: number

  @property({type: Boolean})
  noHorizontalResize = false

  @property({type: Boolean})
  noVerticalResize = false

  @property({type: Boolean})
  noMinimize = false

  @property({type: Boolean})
  noMaximize = false

  @state()
  active = true

  @state()
  state: WindowState | null = null

  @state()
  resizing = false

  private interact?: Interactable

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

    if (overrideWidth || this.width) {
      this.style.width = overrideWidth || `${this.width}px`
    }
  }

  firstUpdated() {
    this.addEventListener('close-window', this.handleCloseWindow)
    this.addEventListener('window-property-change', this.handleWindowPropertyChange)

    /*
     * Problem: we sometimes need to calculate the X and Y coordinates of the window after it's
     * already been rendered, for example, when centering the window on open. However, directly
     * setting X and Y inside firstUpdated() causes Lit to emit a warning about touching a prop
     * mid-update.
     *
     * To mitigate this, we declare a one-shot ResizeObserver inside firstUpdated(), which itself
     * is (for all intents and purposes) triggered by firstUpdated(). And then at the end of its
     * first invocation it disconnects itself.
     */
    const loaderObserver = new ResizeObserver(_ => {
      const bodyStyle = window.getComputedStyle(this.window!)

      const literalWidth = parseInt(bodyStyle.width.replace(/px$/, ''))
      const literalHeight = parseInt(bodyStyle.height.replace(/px$/, ''))

      if (!this.x) {
        this.x = Math.floor((window.innerWidth - literalWidth) / 2)
      }

      if (!this.y) {
        this.y = Math.floor((window.innerHeight - literalHeight) / 2)
      }

      this.resetDimensions()
      this.setActive()
      this.updateLastPosition()

      this.style.transform = `translate(${this.x}px, ${this.y}px)`

      loaderObserver.disconnect()
    })

    this.resetInteract()

    loaderObserver.observe(this.window)
    EpkWindow.instanceCount++
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this.interact?.unset()
    EpkWindow.instanceCount--
  }

  resetInteract() {
    this.interact = interact(this.windowWrapper)

    this.interact.draggable({
      allowFrom: '.title-bar',
      listeners: {move: this.handleDrag.bind(this)},
    })

    if (!(this.noHorizontalResize && this.noVerticalResize)) {
      this.interact.resizable({
        edges: {
          top: false,
          right: !this.noHorizontalResize,
          bottom: !this.noVerticalResize,
          left: !this.noHorizontalResize,
        },
        listeners: {
          start: () => this.resizing = true,
          move: this.handleResize.bind(this),
          end: () => this.resizing = false,
        },
        modifiers: [
          interact.modifiers.restrictSize({
            min: {
              width: this.minWidth,
              height: this.minHeight,
            }
          })
        ]
      })
    }
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

    if (Object.hasOwn(detail, 'fullscreen')) {
      this.setFullscreen(detail.fullscreen!)
    }

    if (detail.height) {
      this.height = detail.height

      this.resetDimensions()
      this.restoreWindow()
      this.updateLastPosition()
    }

    if (Object.hasOwn(detail, 'disallowFlags')) {
      const disallowFlags = detail.disallowFlags!

      this.noHorizontalResize = Boolean(disallowFlags & DisallowFlags.DisallowHorizontalResize)
      this.noVerticalResize = Boolean(disallowFlags & DisallowFlags.DisallowVerticalResize)

      const oldNoMinimize = this.noMinimize
      const oldNoMaximize = this.noMaximize

      this.noMinimize = Boolean(disallowFlags & DisallowFlags.DisallowMinimize)
      this.noMaximize = Boolean(disallowFlags & DisallowFlags.DisallowMaximize)

      if ((!oldNoMinimize && this.noMinimize) || (!oldNoMaximize && this.noMaximize)) {
        this.state = null
        this.resetCoordinates()
        this.resetDimensions()
        this.restoreWindow()
      }

      this.resetInteract()
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
    this.toggleMaximized()
  }

  updateLastPosition() {
    const containedAppName = this.app[0].getPositionTrackingName()

    if (containedAppName) {
      EpkWindow.lastAppPositions.set(containedAppName, {
        x: this.x!,
        y: this.y!,
        width: this.width!,
        height: this.height!,
      })
    }
  }

  handleDrag(event: InteractEvent) {
    if (this.state === WindowState.MAXIMIZED) {
      return
    }

    this.x! += event.dx
    this.y! += event.dy

    this.style.transform = `translate(${this.x}px, ${this.y}px)`
    this.setActive()

    this.updateLastPosition()
  }

  handleResize(event: ResizeEvent) {
    if (this.state !== null) {
      return
    }

    if (event.axes?.includes('x')) {
      this.x! += event.deltaRect!.left
      this.width = event.rect.width - 12
    }

    if (event.axes?.includes('y')) {
      this.y! += event.deltaRect!.top
      this.height = event.rect.height - 15
    }

    this.resetCoordinates()
    this.resetDimensions()
    this.setActive()

    this.updateLastPosition()
  }

  toggleMaximized() {
    if (this.noMaximize) {
      return
    }

    if (this.state === WindowState.MINIMIZED) {
      this.state = null
      this.resetDimensions(this.height ? `${this.height}px` : undefined)
    } else {
      this.state = this.state === null ? WindowState.MAXIMIZED : null

      if (this.state === WindowState.MAXIMIZED) {
        this.resetCoordinates('0', '0')
        this.resetDimensions('100vh', '100vw')
        this.maximizeWindow()
      } else {
        this.resetCoordinates()
        this.resetDimensions()
        this.restoreWindow()
      }
    }
  }

  toggleMinimized() {
    if (this.noMinimize) {
      return
    }

    this.state = this.state === null ? WindowState.MINIMIZED : null

    if (this.state === WindowState.MINIMIZED) {
      this.resetCoordinates()
      this.resetDimensions('28px')
      this.restoreWindow()
    } else {
      this.resetDimensions(this.height ? `${this.height}px` : undefined)
    }
  }

  setFullscreen(fullscreen: boolean) {
    if (fullscreen) {
      this.state = WindowState.FULLSCREEN
      this.resetCoordinates('0', '0')
      this.resetDimensions('100vh', '100vw')
      this.maximizeWindow()
    } else {
      this.state = null
      this.resetCoordinates()
      this.resetDimensions()
      this.restoreWindow()
    }
  }

  render() {
    let windowClass = 'window'

    if (this.active) {
      windowClass += ' active'
    }

    let viewportClass = 'window-viewport'
    let wrapperClass = 'window-wrapper'

    const windowStyle: any = {}

    if (this.state === WindowState.FULLSCREEN) {
      windowClass += ' fullscreen'
      viewportClass += ' fullscreen'
      wrapperClass += ' fullscreen'
    } else {
      windowClass += ' window'

      if (this.state === WindowState.MAXIMIZED) {
        windowClass += ' maximized'
        viewportClass += ' maximized'
      } else {
        if (this.state === WindowState.MINIMIZED) {
          windowClass += ' minimized'
          viewportClass += ' minimized'
        } else if (this.height) {
          windowStyle['height'] = `${this.height}px`
        }

        if (this.width) {
          windowStyle['width'] = `${this.width}px`
        }
      }
    }

    const iconStyle = {'backgroundImage': `url(${this.thumbnail})`}

    return html`
      <div class="${wrapperClass}">
        <div class="${windowClass}" style="${styleMap(windowStyle)}" @click="${this.handleClick}">
          ${this.state === WindowState.FULLSCREEN ? nothing : html`
            <div class="title-bar" @dblclick="${this.handleDblClick}">
              <div class="title-bar-text">
                ${this.thumbnail ? html`
                  <div class="title-bar-icon" style="${styleMap(iconStyle)}"></div>` : nothing}
                <div class="title">${this.title}</div>
              </div>
              <div class="title-bar-controls">
                ${this.noMinimize ? nothing : html`
                  <button aria-label="Minimize" @click="${this.toggleMinimized}"></button>`}
                ${this.noMaximize ? nothing : html`
                  <button
                      aria-label="${this.state === WindowState.MAXIMIZED ? 'Restore' : 'Maximize'}"
                      @click="${this.toggleMaximized}"></button>`}
                <button aria-label="Close"
                        @click="${() => this.dispatchEvent(closeWindowEvent())}"></button>
              </div>
            </div>`}
          <div class="${viewportClass}">
            <slot class="${this.resizing ? 'resizing' : ''}"></slot>
          </div>
        </div>
      </div>
    `
  }
}