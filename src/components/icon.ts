import {property, state} from "lit/decorators.js";
import {styleMap} from "lit/directives/style-map.js";
import {css, type CSSResultGroup, html, LitElement} from "lit";
import {type Launch, launchEvent} from "../lib/events.ts";
import type {EpkApp} from "./app.ts";
import type {LinkNode} from "../lib/fs.ts";

export type IconGraphic = {
  small: string,
  large: string,
}

export enum IconViewMode {
  Tile = 'tile',
  List = 'list',
}

export abstract class EpkIcon extends LitElement {
  static styles: CSSResultGroup = css`
    .filter {
      display: none;
      filter: brightness(0) saturate(100%) invert(34%) sepia(21%) saturate(3619%) hue-rotate(191deg) brightness(100%) contrast(85%) opacity(40%);
      position: absolute;
    }

    .icon {
      -webkit-font-smoothing: none;
      align-items: center;
      display: flex;
      font-family: "Pixelated MS Sans Serif", Arial;
      font-size: 11px;
      user-select: none;
    }

    .icon-name {
      border: 1px solid rgba(0, 0, 0, 0);
      line-height: 1.3;
      margin: 1px;
      padding: 1px;
      text-align: center;
    }

    .icon-wrapper {
      display: flex;
      margin: 0 auto;
      width: fit-content;
    }

    .selected {
      .filter {
        display: block;
      }

      .icon-name {
        background-color: #316ac5;
        border: 1px dotted #ffff7f;
        color: #ffffff;
      }
    }

    .shadowed {
      text-shadow: 2px 2px 2px rgba(0, 0, 0, 75%);
    }

    .view-list {
      flex-direction: row;

      .icon-wrapper {
        margin: 0;
      }
    }

    .view-tile {
      flex-direction: column;
      gap: 6px;
      padding: 8px;

      .icon-name {
        max-width: 80px;
      }
    }`

  @property({type: String})
  color = '#000000'

  @property({type: Object})
  fileLinkNode?: LinkNode

  @property({type: Object})
  icon: IconGraphic = {
    small: '/img/icons/small/unknown-small.ico',
    large: '/img/icons/unknown.ico',
  }

  @property({type: Boolean})
  shadow = false

  @property({type: String})
  viewMode = IconViewMode.Tile

  @state()
  selected = false

  abstract getAppInstance(): EpkApp

  getLaunchOptions(): Omit<Launch, 'init'> {
    return {}
  }

  private select(event: PointerEvent): void {
    this.selected = true
    this.onclick?.(event)
  }

  deselect(): void {
    this.selected = false
  }

  launch(event?: MouseEvent): void {
    if (event && this.ondblclick) {
      this.ondblclick(event)
    } else {
      this.dispatchEvent(launchEvent(this.getAppInstance.bind(this), this.getLaunchOptions()))
    }
  }

  render() {
    const textStyle: any = {};

    if (!this.selected) {
      textStyle.color = this.color
    }

    let iconSize: number
    let iconGraphic: string

    if (this.viewMode === IconViewMode.Tile) {
      iconSize = 48
      iconGraphic = this.icon.large
    } else {
      iconSize = 16
      iconGraphic = this.icon.small
    }

    return html`
      <div class="icon view-${this.viewMode} ${this.selected ? 'selected' : ''}" @click="${this.select}"
           @dblclick="${this.launch}">
        <div class="icon-wrapper">
          <img src="${iconGraphic}" width="${iconSize}" height="${iconSize}"/>
          <img src="${iconGraphic}" class="filter" width="${iconSize}" height="${iconSize}"/>
        </div>
        <span class="icon-name ${this.shadow ? 'shadowed' : ''}" style="${styleMap(textStyle)}">
          <slot></slot>
        </span>
      </div>`
  }
}