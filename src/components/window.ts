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

  private interact: Interactable | null = null;

  handleDrag(event: InteractEvent) {
    this.x += event.dx
    this.y += event.dy
  }

  handleResize(event: ResizeEvent) {
    this.x += event.deltaRect!.left
    this.y += event.deltaRect!.top

    this.width = event.rect.width
    this.height = event.rect.height
  }

  constructor() {
    super()
    EpkWindow.windowCount++
  }

  handleClick() {
    Array.from(document.querySelectorAll('epk-window'))
      .filter(epkWindow => epkWindow !== this)
      .sort((a, b) => parseInt((a as EpkWindow).style.zIndex) - parseInt((b as EpkWindow).style.zIndex))
      .forEach((epkWindow, idx) => {
        (epkWindow as EpkWindow).style.zIndex = idx.toString()
      })

    this.style.zIndex = (EpkWindow.windowCount).toString()
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

    this.style.position = 'relative'
    this.style.zIndex = EpkWindow.windowCount.toString()
    this.addEventListener('click', this.handleClick)
  }

  disconnectedCallback() {
    super.disconnectedCallback()

    if (this.interact) {
      this.interact.unset()
    }

    EpkWindow.windowCount--
  }

  render() {
    const windowStyle = {
      transform: `translate(${this.x}px, ${this.y}px)`,
      width: `${this.width}px`,
      height: `${this.height}px`,
    }

    const iconStyle = {backgroundImage: `url(${this.thumbnail})`}

    return html`
      <link rel="stylesheet" href="https://unpkg.com/XP.css"/>
      <div class="window" style="${styleMap(windowStyle)}">
        <div class="title-bar">
          <div class="title-bar-text">
            <div class="title-bar-icon" style="${styleMap(iconStyle)}"></div>
            ${this.title}
          </div>
          <div class="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close" @click="${() => this.remove()}"></button>
          </div>
        </div>
        <div class="window-body">
          <slot></slot>
        </div>
      </div>
    `
  }
}