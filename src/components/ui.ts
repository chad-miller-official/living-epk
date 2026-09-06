import {css, html, LitElement, nothing, unsafeCSS} from "lit";
import {customElement, property, queryAll} from "lit/decorators.js";
import {type ToolbarMenu, ToolbarUiElement} from "../lib/toolbar.ts";

import xpStyle from 'xp.css/dist/XP.css?inline'

@customElement('epk-toolbar')
export class EpkToolbar extends LitElement {
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
            list-style-type: none;
            margin: 1px;
            padding: 4px 24px 4px 1ch;

            & > span {
              display: flex;
              gap: 4ch;
              justify-content: space-between;
              margin: 0 1ch;
              width: 100%;

              &[data-command]::after {
                content: attr(data-command);
              }
            }

            &.disabled {
              color: #808080;
            }

            &.selected::before {
              content: url('/img/check.png');
            }

            &:not(.selected)::before {
              content: url('/img/check.png');
              opacity: 0;
            }

            &:hover {
              background-color: #316AC5;
              color: #ffffff;
            }
          }
        }
      }
    `
  ]

  @property({attribute: false})
  toolbarSpec!: ToolbarMenu[]

  @queryAll('li.toolbar-menu')
  toolbarItems: NodeListOf<HTMLLIElement> | undefined

  handleToolbarClick(event: Event) {
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

  handleToolbarMenuItemClick(event: Event, func: (event: Event) => void) {
    func(event)
    this.requestUpdate()
  }

  render() {
    return html`
      <menu class="toolbar" @click="${this.handleToolbarClick}">
        ${this.toolbarSpec.map(item => html`
          <li class="toolbar-menu" @mouseenter="${this.handleMouseEnter}">
            ${item.text}
            <ul class="toolbar-menu-items">
              ${item.items.map(subItem => {
                if (subItem === ToolbarUiElement.DIVIDER) {
                  return html`
                    <hr/>`
                } else {
                  return html`
                    <li class="toolbar-menu-item ${!subItem.action ? 'disabled' : ''} ${(subItem.selected && subItem.selected()) ? 'selected' : ''}"
                        @click="${(event: Event) => {
                          if (subItem.action) this.handleToolbarMenuItemClick(event, subItem.action)
                        }}">
                      <span data-command="${subItem.shortcut || nothing}">${subItem.text}</span>
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