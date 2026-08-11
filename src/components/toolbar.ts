import {css, html, LitElement} from "lit";
import {customElement, queryAll} from "lit/decorators.js";
import {type ToolbarItem, ToolbarUiElement} from "../lib/toolbar.ts";

@customElement('epk-toolbar')
export abstract class EpkToolbar extends LitElement {
  static styles = css`
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

    .toolbar-item {
      list-style-type: none;
      padding: 4px 9px;

      &:hover {
        background-color: #316AC5;
        color: #ffffff;
      }

      &.active {
        background-color: #316AC5;
        color: #ffffff;

        & > .toolbar-menu {
          display: block;
        }
      }

      & > .toolbar-menu {
        background-color: #ffffff;
        border: 1px solid #808080;
        color: #000000;
        display: none;
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
          padding: 5px 20px;

          &:hover {
            background-color: #316AC5;
            color: #ffffff;
          }

          &::after {
            content: attr(data-command);
          }
        }
      }
    }
  `

  @queryAll('li.toolbar-item')
  toolbarItems: NodeListOf<HTMLLIElement> | undefined

  abstract getToolbarSpec(): ToolbarItem[]

  handleClick(event: Event) {
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
      <menu class="toolbar">
        ${this.getToolbarSpec().map(item => html`
          <li class="toolbar-item" @click="${this.handleClick}" @mouseenter="${this.handleMouseEnter}">
            ${item.text}
            <ul class="toolbar-menu">
              ${item.items.map(subItem => {
                if (subItem === ToolbarUiElement.DIVIDER) {
                  return html`
                    <hr/>`
                } else {
                  return html`
                    <li class="toolbar-menu-item" data-command="${subItem.shortcut}" @click="${subItem.action}">
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