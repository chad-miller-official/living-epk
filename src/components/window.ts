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
import {playError} from "../lib/os.ts";

export enum DisallowFlags {
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

type WindowPosition = {
  location: Point,
  size: Dimensions,
}

export enum WindowState {
  DEFAULT,
  MINIMIZED,
  MAXIMIZED,
  FULLSCREEN,
}

@customElement('epk-window')
export class EpkWindow extends LitElement {
  static instanceCount = 0
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

  @property({type: Object})
  location?: Point

  @property({type: Object})
  size?: Dimensions

  @property()
  minSize!: Dimensions

  @property({type: Number})
  disallowFlags: DisallowFlags = DisallowFlags.AllowAll

  @state()
  active = true

  @state()
  state: WindowState = WindowState.DEFAULT

  @state()
  previousState: WindowState = WindowState.DEFAULT

  @state()
  resizing = false

  private blinkTimer?: number
  private blinkCounter: number = 0
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
    this.resetCoordinates('0', '0')
    this.resetDimensions('100vh', '100vw')
    this.style.top = '0'
    this.style.left = '0'
  }

  private restoreWindow() {
    this.style.top = 'initial'
    this.style.left = 'initial'
  }

  private resetCoordinates(overrideX?: string, overrideY?: string) {
    const useX = overrideX || `${this.location!.x}px`
    const useY = overrideY || `${this.location!.y}px`
    this.style.transform = `translate(${useX}, ${useY})`
  }

  private resetDimensions(overrideHeight?: string, overrideWidth?: string) {
    this.style.height = overrideHeight || `${this.size!.height}px`
    this.style.width = overrideWidth || `${this.size!.width}px`
  }

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
      this.resetDimensions()
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

  noHorizontalResize() {
    return this.disallowFlags & DisallowFlags.DisallowHorizontalResize
  }

  noVerticalResize() {
    return this.disallowFlags & DisallowFlags.DisallowVerticalResize
  }

  noMinimize() {
    return this.disallowFlags & DisallowFlags.DisallowMinimize
  }

  noMaximize() {
    return this.disallowFlags & DisallowFlags.DisallowMaximize
  }

  resetInteract() {
    if (this.interact) {
      this.interact.unset()
    }

    this.interact = interact(this.windowWrapper)

    this.interact.draggable({
      allowFrom: '.title-bar',
      listeners: {move: this.handleDrag.bind(this)},
    })

    const noHorizontalResize = this.noHorizontalResize()
    const noVerticalResize = this.noVerticalResize()

    if (!(noHorizontalResize && noVerticalResize)) {
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
          interact.modifiers.restrictSize({min: this.minSize})
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

    if (Object.hasOwn(detail, 'state')) {
      this.setFullscreen(detail.state === WindowState.FULLSCREEN)
    }

    if (detail.size?.height) {
      this.size = {
        width: this.size!.width,
        height: detail.size.height,
      }

      this.resetDimensions()
      this.restoreWindow()
      this.updateLastPosition()
    }

    if (Object.hasOwn(detail, 'disallowFlags')) {
      const oldNoMinimize = this.noMinimize()
      const oldNoMaximize = this.noMaximize()

      this.disallowFlags = detail.disallowFlags!

      if ((!oldNoMinimize && this.noMinimize()) || (!oldNoMaximize && this.noMaximize())) {
        this.state = WindowState.DEFAULT
        this.resetCoordinates()
        this.resetDimensions()
        this.restoreWindow()
      }

      this.resetInteract()
    }
  }

  checkBlockingDialog(event: Event) {
    const desktop = this.parentElement as EpkDesktop

    const blockingDialogWindow = desktop.windows.filter(w =>
      w !== this && Object.hasOwn(w.app[0], 'delegatingAppId')
        // @ts-ignore
        ? w.app[0].delegatingAppId === this.app[0].getAppId()
        : false
    ).pop()

    if (blockingDialogWindow) {
      event.stopPropagation()
      // TODO change this sound to ding
      playError().then(() => blockingDialogWindow.blink(
        /*
         * This isn't a great solution, but it's the best we have for now: manually add/remove a class to prevent
         * pointer-events, but only while the blocking dialog window is blinking. We can't set pointer-events to none
         * as soon as the dialog box is open, because then click events don't fire when the parent window is clicked,
         * breaking blink behavior entirely.
         */
        () => this.classList.add('no-interact'),
        () => this.classList.remove('no-interact')
      ))

      return true
    }

    return false
  }

  blink(preHook?: () => void, postHook?: () => void) {
    if (this.blinkTimer) {
      return
    }

    preHook?.()

    this.blinkTimer = setInterval(() => {
      this.active = !this.active
      this.blinkCounter++

      if (this.blinkCounter > 10) {
        clearInterval(this.blinkTimer)
        this.dispatchEvent(activeWindowChangeEvent())
        this.blinkTimer = undefined
        this.blinkCounter = 0
        postHook?.()
      }
    }, 100)
  }

  handleClick(event: Event) {
    if (this.isClosing) {
      event.stopPropagation()
    } else {
      if (this.checkBlockingDialog(event)) {
        return
      }

      this.dispatchEvent(activeWindowChangeEvent())
    }
  }

  handleCloseClick(event: Event) {
    if (this.checkBlockingDialog(event)) {
      return
    }

    this.app[0]?.close()
  }

  handleDblClick(event: Event) {
    if (this.checkBlockingDialog(event)) {
      return
    }

    this.toggleMaximized()
  }

  updateLastPosition() {
    const containedAppName = this.app[0].getPositionTrackingName()

    if (containedAppName) {
      EpkWindow.lastAppPositions.set(containedAppName, {
        location: this.location!,
        size: this.size!,
      })
    }
  }

  handleDrag(event: InteractEvent) {
    if (this.state === WindowState.MAXIMIZED) {
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

  handleResize(event: ResizeEvent) {
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

    this.resetCoordinates()
    this.resetDimensions()
    this.updateLastPosition()
    this.dispatchEvent(activeWindowChangeEvent())
  }

  toggleMaximized() {
    if (this.noMaximize()) {
      return
    }

    if (this.state === WindowState.MINIMIZED) {
      this.state = WindowState.DEFAULT
      this.resetDimensions(this.size!.height ? `${this.size!.height}px` : undefined)
    } else {
      this.state = !this.state ? WindowState.MAXIMIZED : WindowState.DEFAULT

      if (this.state === WindowState.MAXIMIZED) {
        this.maximizeWindow()
      } else {
        this.resetCoordinates()
        this.resetDimensions()
        this.restoreWindow()
      }
    }
  }

  toggleMinimized() {
    if (this.noMinimize()) {
      return
    }

    this.state = !this.state ? WindowState.MINIMIZED : WindowState.DEFAULT

    if (this.state === WindowState.MINIMIZED) {
      this.resetCoordinates()
      this.resetDimensions('28px')
      this.restoreWindow()
    } else {
      this.resetDimensions(this.size!.height ? `${this.size!.height}px` : undefined)
    }
  }

  setFullscreen(fullscreen: boolean) {
    if (fullscreen) {
      this.previousState = this.state
      this.state = WindowState.FULLSCREEN
      this.maximizeWindow()
    } else {
      this.state = this.previousState

      if (this.state !== WindowState.MAXIMIZED) {
        this.resetCoordinates()
        this.resetDimensions()
        this.restoreWindow()
      }
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
        } else if (this.size!.height) {
          windowStyle['height'] = `${this.size!.height}px`
        }

        if (this.size!.width) {
          windowStyle['width'] = `${this.size!.width}px`
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
                ${this.noMinimize() ? nothing : html`
                  <button aria-label="Minimize" @click="${this.toggleMinimized}"></button>`}
                ${this.noMaximize() ? nothing : html`
                  <button
                      aria-label="${this.state === WindowState.MAXIMIZED ? 'Restore' : 'Maximize'}"
                      @click="${this.toggleMaximized}"></button>`}
                <button aria-label="Close" @click="${this.handleCloseClick}"></button>
              </div>
            </div>`}
          <div class="${viewportClass}">
            <slot class="${this.resizing ? 'resizing' : ''}"></slot>
          </div>
        </div>
      </div>`
  }
}