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
  IconView = 'icon',
  ListView = 'list',
}

export abstract class EpkIcon extends LitElement {
  static styles: CSSResultGroup = css`
    .container {
      -webkit-font-smoothing: none;
      align-items: center;
      display: flex;
      font-family: "Pixelated MS Sans Serif", Arial;
      font-size: 11px;
      height: fit-content;
      max-width: max-content;
      user-select: none;

      &.icon {
        flex-direction: column;
        gap: 6px;
        padding: 8px;

        .icon-name {
          max-width: 80px;
        }
      }

      &.list {
        flex-direction: row;

        .fx-wrapper {
          margin: 0;
        }
      }

      &.selected {
        .fx {
          display: block;
        }

        .icon-name {
          background-color: #316AC5;
          border: 1px dotted #FFFF7F;
          color: #ffffff;
        }
      }
    }

    .fx {
      display: none;
      filter: drop-shadow(10000px 0 0 rgb(49 106 197 / 50%));
      position: absolute;
      transform: translateX(-10000px);
    }

    .fx-wrapper {
      display: flex;
      margin: 0 auto;
      width: fit-content;
    }

    .icon-name {
      border: 1px solid #ffffff00;
      line-height: 1.3;
      margin: 1px;
      padding: 1px;
      text-align: center;

      &:hover {
        cursor: default;
      }
    }

    .shadowed {
      text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.75);
    }
  `

  @property({type: String})
  title = ''

  @property({type: Object})
  icon: IconGraphic = {
    small: '/img/icons/unknown.ico',
    large: '/img/icons/unknown.ico',
  }

  @property({type: String})
  color = '#000000'

  @property({type: Boolean})
  shadow = false

  @property({type: Object})
  fileLinkNode?: LinkNode

  @property()
  viewMode = IconViewMode.IconView

  @state()
  selected = false

  abstract getAppInstance(): EpkApp

  getLaunchOptions(): Omit<Launch, 'init'> {
    return {}
  }

  handleClick(event: PointerEvent) {
    this.selected = true
    this.onclick?.(event)
  }

  handleDblClick() {
    this.dispatchEvent(launchEvent(this.getAppInstance.bind(this), this.getLaunchOptions()))
  }

  render() {
    let iconClassName = `container ${this.viewMode}`
    const textStyle: any = {};

    if (this.selected) {
      iconClassName += ' selected'
    } else {
      textStyle.color = this.color
    }

    let titleClassName = 'icon-name'

    if (this.shadow) {
      titleClassName += ' shadowed'
    }

    let iconSize: number
    let iconGraphic: string

    if (this.viewMode === IconViewMode.IconView) {
      iconSize = 48
      iconGraphic = this.icon.large
    } else {
      iconSize = 16
      iconGraphic = this.icon.small
    }

    return html`
      <div class="${iconClassName}" @click="${this.handleClick}" @dblclick="${this.handleDblClick}">
        <div class="fx-wrapper">
          <img src="${iconGraphic}" width="${iconSize}" height="${iconSize}"/>
          <img src="${iconGraphic}" class="fx" width="${iconSize}" height="${iconSize}"/>
        </div>
        <span class="${titleClassName}" style="${styleMap(textStyle)}">
          ${this.title}
        </span>
      </div>`
  }
}