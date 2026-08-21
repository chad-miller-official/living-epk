import {property, state} from "lit/decorators.js";
import {styleMap} from "lit/directives/style-map.js";
import {css, type CSSResultGroup, html, LitElement} from "lit";
import {launchEvent, type LaunchOptions} from "../lib/events.ts";
import type {EpkApp} from "../apps/base.ts";

export abstract class EpkIcon extends LitElement {
  static styles: CSSResultGroup = css`
    .fx {
      display: none;
      filter: drop-shadow(10000px 0 0 rgb(49 106 197 / 50%));
      position: absolute;
      transform: translateX(-10000px);

      &.selected {
        display: block;
      }
    }

    .icon-wrapper {
      display: flex;
      margin: 0 auto 8px auto;
      width: fit-content;
    }

    .icon {
      -webkit-font-smoothing: none;
      font-family: "Pixelated MS Sans Serif", Arial;
      font-size: 11px;
      height: fit-content;
      max-width: max-content;
      padding: 8px;
      user-select: none;
    }

    .icon-name {
      border: 1px solid #ffffff00;
      line-height: 1.3;
      margin: 1px;
      max-width: 80px;
      padding: 1px;
      text-align: center;

      &:hover {
        cursor: default;
      }

      &.selected {
        background-color: #316AC5;
        border: 1px dotted #FFFF7F;
        color: #ffffff;
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
    let titleClassName = 'icon-name'
    let fxClassName = 'fx'

    const textStyle: any = {};

    if (this.selected) {
      titleClassName += ' selected'
      fxClassName += ' selected'
    } else {
      textStyle.color = this.color
    }

    if (this.shadow) {
      titleClassName += ' shadowed'
    }

    return html`
      <div class="icon" @click="${this.handleClick}" @dblclick="${this.handleDblClick}">
        <div class="icon-wrapper">
          <img src="${this.icon}" alt="${this.icon}" width="48" height="48"/>
          <img src="${this.icon}" class="${fxClassName}" width="48" height="48"/>
        </div>
        <p class="${titleClassName}" style="${styleMap(textStyle)}">
          ${this.title}
        </p>
      </div>
    `
  }
}