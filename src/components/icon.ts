import {customElement, property} from "lit/decorators.js";
import {styleMap} from "lit/directives/style-map.js";
import {css, html, LitElement} from "lit";

@customElement('epk-icon')
export class EpkIcon extends LitElement {
  static styles = css`
    .active {
      background-color: #316AC5;
      border: 1px dotted #FFFF7F;
    }

    .icon-container {
      -webkit-font-smoothing: none;
      align-items: center;
      display: flex;
      flex-direction: column;
      font-family: "Pixelated MS Sans Serif", Arial;
      font-size: 11px;
      gap: 4px;
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

    .icon-name.active {
      margin: 0;
    }
  `

  @property({type: String})
  image = ''

  @property({type: String})
  color = '#000000'

  @property({type: Boolean})
  selected = false

  select() {
    document.querySelectorAll('epk-icon').forEach(epkIcon => {
      (epkIcon as EpkIcon).selected = false
    })

    this.selected = true
  }

  render() {
    let className = 'icon-name'
    const textStyle = {color: this.color};

    if (this.selected) {
      className += ' active'
      textStyle.color = '#ffffff';
    }

    return html`
      <link rel="stylesheet" href="https://unpkg.com/XP.css"/>
      <div class="icon-container" @click="${this.select}">
        <img src="${this.image}" alt="${this.image}" class="icon" width="48" height="48"/>
        <span class="${className}" style="${styleMap(textStyle)}">
          <slot>Untitled</slot>
        </span>
      </div>
    `
  }
}