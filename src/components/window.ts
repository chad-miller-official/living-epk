import {customElement, property, query, queryAssignedElements, state} from "lit/decorators.js";
import {css, html, LitElement, nothing, unsafeCSS} from "lit";
import interact from "interactjs";
import type {Interactable, InteractEvent} from "@interactjs/types";
import {styleMap} from "lit/directives/style-map.js";
import type {ResizeEvent} from "@interactjs/actions/resize/plugin";
import {
  activeWindowChangeEvent,
  CLOSE_WINDOW_EVENT,
  WINDOW_PROPERTY_CHANGE_EVENT,
  type WindowProperties
} from "../lib/events.ts";

import xpStyle from 'xp.css/dist/XP.css?inline'
import type {EpkApp} from "./app.ts";
import type {EpkDesktop} from "./desktop.ts";
import {playSound, SystemSound} from "../lib/os.ts";
import {classMap} from "lit/directives/class-map.js";

const MINIMIZED_HEIGHT = 28

export enum WindowRestriction {
  AllowAll = 0b0000,
  DisallowMaximize = 0b0001,
  DisallowMinimize = 0b0010,
  DisallowVerticalResize = 0b0100,
  DisallowHorizontalResize = 0b1000,
  DisallowResize = DisallowVerticalResize | DisallowHorizontalResize,
  DisallowAll = DisallowMaximize | DisallowMinimize | DisallowResize,
}

export type Point = {
  x: number,
  y: number,
}

export type Dimensions = {
  width: number,
  height: number,
}

type Position = {
  location: Point,
  size: Dimensions,
}

/*
 * These enum values are ordered in a precise way: it allows us to check for state in a way that
 * mirrors how we think about sizes. For example, to check if a window takes up the whole screen,
 * we can check: this.state >= WindowState.Maximized, i.e. "this.state is at least as big as
 * maximized." This also accounts for checking if the window is fullscreen.
 *
 * One may then ask: why is Default = 0 instead of Minimized = 0 if Minimized is supposed to be
 * the smallest? The answer is: this easily accommodates checking if the window is a non-default
 * state, because we can then simply check: Boolean(this.state).
 */
export enum WindowState {
  Default,
  Minimized,
  Maximized,
  Fullscreen,
}

@customElement('epk-window')
export class EpkWindow extends LitElement {
  static instanceCount = 0
  static lastAppPositions = new Map<string, Position>()

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

        &:not(.active) {
          filter: contrast(0.4) brightness(1.2);
        }

        &.maximized {
          border-top-left-radius: 0;
          border-top-right-radius: 0;
          padding-right: 2px;
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
          box-shadow: inset -1px -1px #5c659f, inset 1px 1px #6073c4,
          inset -2px -2px #5c6aa9,
          inset 2px 2px #647ecf,
          inset -3px -3px #5c74ca,
          inset 3px 3px #607ecb;

          user-select: none;
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
          width: 100%;
        }

        &.maximized {
          height: 100%;
          width: 100%;
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
      }`
  ]

  @query('.window')
  window!: HTMLElement

  @query('.window-wrapper')
  windowWrapper!: HTMLElement

  @queryAssignedElements({selector: '.epk-app'})
  app!: EpkApp[]

  @property({type: Number})
  disallowFlags: WindowRestriction = WindowRestriction.AllowAll

  @property({type: Object})
  location?: Point

  @property({type: Object})
  minSize!: Partial<Dimensions>

  @property({type: Object})
  size?: Partial<Dimensions>

  @property({type: String})
  thumbnail = ''

  @property({type: String})
  title = "Untitled Window"

  @state()
  active = true

  @state()
  previousState: WindowState = WindowState.Default

  @state()
  resizing = false

  @state()
  state: WindowState = WindowState.Default

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

  firstUpdated() {
    this.addEventListener(CLOSE_WINDOW_EVENT, this.handleCloseWindow)
    this.addEventListener(WINDOW_PROPERTY_CHANGE_EVENT, this.handleWindowPropertyChange)

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

      if (!this.location?.x || !this.location?.y) {
        this.location = {
          x: this.location?.x || Math.floor((window.innerWidth - literalWidth) / 2),
          y: this.location?.y || Math.floor((window.innerHeight - literalHeight) / 2),
        }
      }

      this.dispatchEvent(activeWindowChangeEvent())
      this.resetSize()
      this.updateLastPosition()
      this.style.transform = `translate(${this.location.x}px, ${this.location.y}px)`

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

  private resetLocation(overrideX?: string, overrideY?: string): void {
    const useX = overrideX || `${this.location!.x}px`
    const useY = overrideY || `${this.location!.y}px`
    this.style.transform = `translate(${useX}, ${useY})`
  }

  private resetSize(overrideHeight?: string, overrideWidth?: string): void {
    this.style.height = overrideHeight || `${this.size!.height}px`
    this.style.width = overrideWidth || `${this.size!.width}px`
  }

  private noMinimize(): boolean {
    return Boolean(this.disallowFlags & WindowRestriction.DisallowMinimize)
  }

  private noMaximize(): boolean {
    return Boolean(this.disallowFlags & WindowRestriction.DisallowMaximize)
  }

  private resetInteract(): void {
    if (this.interact) {
      this.interact.unset()
    }

    this.interact = interact(this.windowWrapper)

    this.interact.draggable({
      allowFrom: '.title-bar',
      listeners: {move: this.handleDrag.bind(this)},
    })

    const noHorizontalResize = this.disallowFlags & WindowRestriction.DisallowHorizontalResize
    const noVerticalResize = this.disallowFlags & WindowRestriction.DisallowVerticalResize

    if (!(this.state === WindowState.Minimized || (noHorizontalResize && noVerticalResize))) {
      this.interact.resizable({
        edges: {
          top: false,
          right: !noHorizontalResize,
          bottom: !noVerticalResize,
          left: !noHorizontalResize,
        },
        listeners: {
          start: () => this.resizing = true,
          move: this.handleResize.bind(this),
          end: () => this.resizing = false,
        },
        modifiers: [
          interact.modifiers.restrictSize({
            min: {
              width: this.minSize.width || 0,
              height: this.minSize.height || 0,
            }
          })
        ]
      })
    }
  }

  private handleCloseWindow(): void {
    this.remove()
    this.isClosing = true
  }

  private handleWindowPropertyChange(event: Event): void {
    const detail = (event as CustomEvent<WindowProperties>).detail

    if (detail.title) {
      this.title = detail.title
    }

    if (detail.thumbnail) {
      this.thumbnail = detail.thumbnail
    }

    if ('state' in detail) {
      this.setFullscreen(detail.state === WindowState.Fullscreen)
    }

    if (detail.size?.height) {
      this.size = {
        width: this.size!.width,
        height: detail.size.height,
      }

      this.resetSize()
      this.restoreWindow()
      this.updateLastPosition()
    }

    if ('disallowFlags' in detail) {
      const oldNoMinimize = this.noMinimize()
      const oldNoMaximize = this.noMaximize()

      this.disallowFlags = detail.disallowFlags!

      if ((!oldNoMinimize && this.noMinimize()) || (!oldNoMaximize && this.noMaximize())) {
        this.state = WindowState.Default
        this.resetLocation()
        this.resetSize()
        this.restoreWindow()
      }

      this.resetInteract()
    }
  }

  getApp(): EpkApp {
    return this.app[0]
  }

  setActive() {
    this.active = true
  }

  setInactive() {
    this.active = false
  }

  private checkBlockingDialog(event: Event): boolean {
    const desktop = this.parentElement as EpkDesktop

    const blockingDialogWindow = desktop.windows.filter(w =>
      w !== this && 'delegatingAppId' in w.getApp()
        // @ts-ignore
        ? w.getApp().delegatingAppId === this.getApp().getAppId()
        : false
    ).pop()

    if (blockingDialogWindow) {
      event.stopPropagation()

      playSound(SystemSound.Ding).then(() => {
        /*
         * This isn't a great solution, but it's the best we have for now: manually add/remove a class to prevent
         * pointer-events, but only while the blocking dialog window is blinking. We can't set pointer-events to none
         * as soon as the dialog box is open, because then click events don't fire when the parent window is clicked,
         * breaking blink behavior entirely.
         */

        this.classList.add('no-interact')
        blockingDialogWindow.blink().then(() => this.classList.remove('no-interact'))
      })

      return true
    }

    return false
  }

  private blink(): Promise<void> {
    let blinkTimer: number

    return new Promise<void>((resolve) => {
      let blinkCounter = 0

      blinkTimer = setInterval(() => {
        this.active = !this.active
        blinkCounter++

        if (blinkCounter > 10) {
          clearInterval(blinkTimer)
          this.dispatchEvent(activeWindowChangeEvent())
          resolve()
        }
      }, 100)
    })
  }

  private updateLastPosition(): void {
    const positionTrackingName = this.getApp().getPositionTrackingName()

    if (positionTrackingName) {
      EpkWindow.lastAppPositions.set(positionTrackingName, {
        location: this.location!,
        size: {
          width: this.size!.width!,
          height: this.size!.height!,
        },
      })
    }
  }

  private handleDrag(event: InteractEvent): void {
    if (this.state >= WindowState.Maximized) {
      return
    }

    this.location = {
      x: this.location!.x + event.dx,
      y: this.location!.y + event.dy,
    }

    this.style.transform = `translate(${this.location.x}px, ${this.location.y}px)`
    this.updateLastPosition()
    this.dispatchEvent(activeWindowChangeEvent())
  }

  private handleResize(event: ResizeEvent): void {
    if (this.state) {
      return
    }

    const newSize = {width: this.size!.width, height: this.size!.height}
    const newLocation = {x: this.location!.x, y: this.location!.y}

    if (event.axes?.includes('x')) {
      newLocation.x += event.deltaRect!.left
      newSize.width = event.rect.width - 12
    }

    if (event.axes?.includes('y')) {
      newLocation.y += event.deltaRect!.top
      newSize.height = event.rect.height - 15
    }

    this.location = newLocation
    this.size = newSize

    this.resetLocation()
    this.resetSize()
    this.updateLastPosition()
    this.dispatchEvent(activeWindowChangeEvent())
  }

  private maximizeWindow(): void {
    this.resetLocation('0', '0')
    this.resetSize('100vh', '100vw')
    this.style.top = '0'
    this.style.left = '0'
  }

  private restoreWindow(): void {
    this.style.top = 'initial'
    this.style.left = 'initial'
  }

  private toggleMaximized(): void {
    if (this.state === WindowState.Minimized) {
      this.state = WindowState.Default
      this.resetSize(this.size!.height ? `${this.size!.height}px` : undefined)
    } else {
      this.state = !this.state ? WindowState.Maximized : WindowState.Default

      if (this.state === WindowState.Maximized) {
        this.maximizeWindow()
      } else {
        this.resetLocation()
        this.resetSize()
        this.restoreWindow()
      }
    }
  }

  private toggleMinimized(): void {
    this.state = !this.state ? WindowState.Minimized : WindowState.Default

    if (this.state === WindowState.Minimized) {
      this.resetLocation()
      this.resetSize(`${MINIMIZED_HEIGHT}px`)
      this.restoreWindow()
    } else {
      this.resetSize(this.size!.height ? `${this.size!.height}px` : undefined)
    }

    this.resetInteract()
  }

  private setFullscreen(fullscreen: boolean): void {
    if (fullscreen) {
      this.previousState = this.state
      this.state = WindowState.Fullscreen
      this.maximizeWindow()
    } else {
      this.state = this.previousState

      if (this.state !== WindowState.Maximized) {
        this.resetLocation()
        this.resetSize()
        this.restoreWindow()
      }
    }
  }

  private handleClick(event: Event): void {
    if (this.isClosing) {
      event.stopPropagation()
    } else if (!this.checkBlockingDialog(event)) {
      this.dispatchEvent(activeWindowChangeEvent())
    }
  }

  private handleDblClick(event: Event): void {
    if (!this.checkBlockingDialog(event)) {
      this.toggleMaximized()
    }
  }

  private handleExit(event: Event): void {
    if (!this.checkBlockingDialog(event)) {
      this.getApp()?.close()
    }
  }

  render() {
    const windowClass = {
      window: true,
      active: this.active,
      minimized: this.state === WindowState.Minimized,
      maximized: this.state === WindowState.Maximized,
      fullscreen: this.state === WindowState.Fullscreen,
    }

    const viewportClass = {
      'window-viewport': true,
      minimized: this.state === WindowState.Minimized,
      maximized: this.state === WindowState.Maximized,
      fullscreen: this.state === WindowState.Fullscreen,
    }

    const titleBarClass = {
      'title-bar': true,
      active: this.active,
      maximized: this.state === WindowState.Maximized,
    }

    const windowStyle: any = {}

    if (this.state < WindowState.Maximized) {
      if (this.state !== WindowState.Minimized) {
        windowStyle['height'] = `${this.size!.height}px`
      }

      if (this.size!.width) {
        windowStyle['width'] = `${this.size!.width}px`
      }
    }

    return html`
      <div class="window-wrapper ${this.state === WindowState.Fullscreen ? 'fullscreen' : ''}">
        <div class="${classMap(windowClass)}" style="${styleMap(windowStyle)}" @click="${this.handleClick}">
          ${this.state === WindowState.Fullscreen ? nothing : html`
            <div class="${classMap(titleBarClass)}" @dblclick="${this.handleDblClick}">
              <div class="title-bar-text">
                ${this.thumbnail ? html`
                  <div class="title-bar-icon"
                       style="${styleMap({'backgroundImage': `url(${this.thumbnail})`})}"></div>` : nothing}
                <div class="title">${this.title}</div>
              </div>
              <div class="title-bar-controls">
                ${this.noMinimize() ? nothing : html`
                  <button aria-label="Minimize" @click="${this.toggleMinimized}"></button>`}
                ${this.noMaximize() ? nothing : html`
                  <button
                      aria-label="${this.state === WindowState.Maximized ? 'Restore' : 'Maximize'}"
                      @click="${this.toggleMaximized}"></button>`}
                <button aria-label="Close" @click="${this.handleExit}"></button>
              </div>
            </div>`}
          <div class="${classMap(viewportClass)}">
            <slot class="${this.resizing ? 'resizing' : ''}"></slot>
          </div>
        </div>
      </div>`
  }
}