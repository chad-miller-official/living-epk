import {property, state} from "lit/decorators.js";
import {styleMap} from "lit/directives/style-map.js";
import {css, type CSSResultGroup, html, LitElement} from "lit";
import {launchEvent, type LaunchOptions} from "../lib/events.ts";
import type {EpkApp} from "./app.ts";

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
      text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
    }
  `

  @property({type: String})
  title = ''

  @property({type: String})
  icon = ''

  @property({type: String})
  color = '#000000'

  @property({type: Boolean})
  shadow = false

  @property({type: String})
  filePath: string | undefined

  @property({type: Number})
  timestamp = 0

  @property()
  viewMode = IconViewMode.IconView

  @state()
  selected = false

  abstract getAppInstance(): Promise<EpkApp>

  getLaunchOptions(): LaunchOptions {
    return {}
  }

  handleClick() {
    this.selected = true
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

    let iconSize = this.viewMode === IconViewMode.ListView ? 16 : 48

    return html`
      <div class="${iconClassName}" @click="${this.handleClick}" @dblclick="${this.handleDblClick}">
        <div class="fx-wrapper">
          <img src="${this.icon}" alt="${this.icon}" width="${iconSize}" height="${iconSize}"/>
          <img src="${this.icon}" class="fx" width="${iconSize}" height="${iconSize}"/>
        </div>
        <span class="${titleClassName}" style="${styleMap(textStyle)}">
          ${this.title}
        </span>
      </div>
    `
  }
}