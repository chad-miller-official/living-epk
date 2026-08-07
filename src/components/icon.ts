import {property, state} from "lit/decorators.js";
import {styleMap} from "lit/directives/style-map.js";
import {css, type CSSResultGroup, html, LitElement} from "lit";
import {launchEvent} from "../lib/events.ts";
import type {EpkApp} from "../apps/base.ts";

export abstract class EpkIcon extends LitElement {
  static styles: CSSResultGroup = css`
    .fx {
      filter: drop-shadow(10000px 0 0 rgb(49 106 197 / 50%));
      position: absolute;
      transform: translateX(-10000px);
    }

    .fx-wrapper {
      display: flex;
    }

    .icon {
      -webkit-font-smoothing: none;
      align-items: center;
      display: flex;
      flex-direction: column;
      font-family: "Pixelated MS Sans Serif", Arial;
      font-size: 11px;
      gap: 4px;
      height: fit-content;
      justify-content: center;
      max-width: max-content;
      padding: 8px;
      user-select: none;
    }

    .icon-name {
      margin: 1px;
      max-width: 64px;
      padding: 1px;
      text-align: center;

      &:hover {
        cursor: default;
      }
    }

    .selected {
      background-color: #316AC5;
      border: 1px dotted #FFFF7F;
      margin: 0;
    }
  `

  @property({type: String})
  title = ''

  @property({type: String})
  icon = ''

  @property({type: String})
  color = '#000000'

  @state()
  selected = false

  abstract getAppInstance(): EpkApp

  handleClick() {
    this.selected = true
  }

  handleDblClick() {
    this.dispatchEvent(launchEvent(this.getAppInstance.bind(this)))
  }

  render() {
    let className = 'icon-name'
    const textStyle = {color: this.color};

    if (this.selected) {
      className += ' selected'
      textStyle.color = '#ffffff';
    }

    return html`
      <div class="icon" @click="${this.handleClick}" @dblclick="${this.handleDblClick}">
        <div class="fx-wrapper">
          <img src="${this.icon}" alt="${this.icon}" width="48" height="48"/>
          ${this.selected ? html`<img src="${this.icon}" class="fx" width="48" height="48"/>` : ''}
        </div>
        <span class="${className}" style="${styleMap(textStyle)}">
          ${this.title}
        </span>
      </div>
    `
  }
}