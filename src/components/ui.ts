import {css, html, LitElement, nothing, unsafeCSS} from "lit";
import {customElement, queryAll} from "lit/decorators.js";
import {type ToolbarMenu, ToolbarUiElement} from "../lib/toolbar.ts";

import xpStyle from 'xp.css/dist/XP.css?inline'

@customElement('epk-toolbar')
export abstract class EpkToolbar extends LitElement {
  static styles = [
    unsafeCSS(xpStyle),
    css`
      .toolbar {
        border-bottom: 1px groove #c7c5b2;
        display: flex;
        font-family: "Pixelated MS Sans Serif", ui-sans-serif;
        font-style: normal;
        font-weight: 400;
        margin: 0;
        padding: 1px 2px;
        user-select: none;
      }

      .toolbar-menu {
        list-style-type: none;
        padding: 4px 9px;

        &:hover {
          background-color: #316AC5;
          color: #ffffff;
        }

        &.active {
          background-color: #316AC5;
          color: #ffffff;

          & > .toolbar-menu-items {
            display: block;
          }
        }

        & > .toolbar-menu-items {
          background-color: #ffffff;
          border: 1px solid #808080;
          color: #000000;
          display: none;
          filter: drop-shadow(3px 2px 2px #00000070);
          margin-left: -9px;
          margin-top: 4px;
          padding: 0;
          position: absolute;

          & > hr {
            color: #808080;
            margin: 0 4px;
          }

          & > .toolbar-menu-item {
            display: flex;
            justify-content: space-between;
            gap: 4ch;
            list-style-type: none;
            margin: 1px;
            padding: 4px 24px;

            &:hover {
              background-color: #316AC5;
              color: #ffffff;
            }

            &[data-command]::after {
              content: attr(data-command);
            }
          }
        }
      }
    `
  ]

  @queryAll('li.toolbar-menu')
  toolbarItems: NodeListOf<HTMLLIElement> | undefined

  abstract getToolbarSpec(): ToolbarMenu[]

  handleClick(event: Event) {
    if (event.target instanceof HTMLMenuElement) {
      this.closeAll()
      return
    }

    const targetLi = event.target as HTMLLIElement

    const selectedLi = Array.from(this.toolbarItems!)
      .filter(item => item.classList.contains('active'))
      .pop()

    if (selectedLi) {
      if (selectedLi === targetLi) {
        targetLi.classList.remove('active')
        return
      } else {
        selectedLi.classList.remove('active')
      }
    }

    targetLi.classList.add('active')
  }

  handleMouseEnter(event: Event) {
    const targetLi = event.target as HTMLLIElement

    const selectedLi = Array.from(this.toolbarItems!)
      .filter(item => item.classList.contains('active'))
      .pop()

    if (selectedLi) {
      selectedLi.classList.remove('active')
      targetLi.classList.add('active')
    }
  }

  closeAll() {
    if (this.toolbarItems) {
      this.toolbarItems.forEach(item => item.classList.remove('active'))
    }
  }

  render() {
    return html`
      <menu class="toolbar" @click="${this.handleClick}">
        ${this.getToolbarSpec().map(item => html`
          <li class="toolbar-menu" @mouseenter="${this.handleMouseEnter}">
            ${item.text}
            <ul class="toolbar-menu-items">
              ${item.items.map(subItem => {
                if (subItem === ToolbarUiElement.DIVIDER) {
                  return html`
                    <hr/>`
                } else {
                  return html`
                    <li class="toolbar-menu-item" data-command="${subItem.shortcut || nothing}"
                        @click="${subItem.action}">
                      ${subItem.text}
                    </li>
                  `
                }
              })}
            </ul>
          </li>
        `)}
      </menu>
    `
  }
}

export abstract class EpkStatusBar extends LitElement {
  static styles = [
    unsafeCSS(xpStyle),
    css`
      .status-bar-field {
        user-select: none;
      }
    `
  ]

  render() {
    return html`
      <div class="status-bar">
        <p class="status-bar-field"></p>
      </div>
    `
  }
}