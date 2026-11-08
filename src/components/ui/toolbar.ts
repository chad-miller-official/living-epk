import {css, html, LitElement, nothing, type TemplateResult, unsafeCSS} from "lit";
import {customElement, property, queryAll} from "lit/decorators.js";

import xpStyle from 'xp.css/dist/XP.css?inline'

export enum ToolbarUiElement {
  DIVIDER,
}

export enum ToolbarSelectionStyle {
  CHECK = 'check',
  RADIO = 'radio',
}

export type ToolbarMenuItem = {
  text: string,
  shortcut?: string,
  selected?: boolean | (() => boolean),
  disabled?: boolean | (() => boolean),
  action?: (event: Event) => void,
  bold?: boolean | (() => boolean),
}

export type ToolbarMenu = {
  text: string,
  items: (ToolbarMenuItem | ToolbarUiElement | ToolbarMenu)[],
  selectedStyle?: ToolbarSelectionStyle,
}

@customElement('epk-toolbar')
export class EpkToolbar extends LitElement {
  static styles = [
    unsafeCSS(xpStyle),
    css`
      hr {
        color: #808080;
        margin: 0 4px;
      }

      menu {
        display: flex;
        font-family: "Pixelated MS Sans Serif", ui-sans-serif;
        font-style: normal;
        font-weight: 400;
        margin: 0;
        padding: 1px 2px;
        user-select: none;
      }

      .logo-container {
        background-color: #ffffff;
        border-left: 1px groove #c7c5b2;
        padding: 0 10px;
        user-select: none;
      }

      .toolbar-container {
        align-items: center;
        border-bottom: 1px groove #c7c5b2;
        display: flex;
        justify-content: space-between;
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
      }

      .toolbar-menu-item {
        display: flex;
        justify-content: space-between;
        list-style-type: none;
        margin: 1px;
        padding: 4px calc(7px + 1ch);

        & > span {
          display: flex;
          gap: 4ch;
          justify-content: space-between;
          margin: 0 1ch;
          width: 100%;

          &[data-command]::after {
            content: attr(data-command);
          }

          &.bold {
            font-weight: bold;
          }
        }

        &.disabled {
          color: #808080;
        }

        &.selected {
          padding-left: 1ch;

          &::before {
            content: url('/img/check.png');
          }

          &.radio::before {
            content: "\\25CF";
          }
        }

        &.toolbar-menu {
          padding-right: 1ch;

          &::after {
            content: "\\25B6";
            font-size: 6pt;
            margin-left: 4px;
          }

          & > .toolbar-menu-items {
            left: calc(100% + 5px);
            margin-top: -4px;
          }

          &:hover > .toolbar-menu-items {
            display: block;
          }
        }

        &:hover {
          background-color: #316AC5;
          color: #ffffff;
        }
      }

      .toolbar-menu-items {
        background-color: #ffffff;
        border: 1px solid #808080;
        color: #000000;
        display: none;
        filter: drop-shadow(3px 2px 2px #00000070);
        margin-left: -9px;
        margin-top: 4px;
        padding: 0;
        position: absolute;
        width: max-content;
      }
    `
  ]

  @property({type: String})
  logo?: string

  @property({attribute: false})
  toolbarSpec!: ToolbarMenu[]

  @queryAll('li.toolbar-menu')
  toolbarItems: NodeListOf<HTMLLIElement> | undefined

  handleItemClick(event: Event) {
    event.stopPropagation()

    let targetLi = event.target as HTMLElement

    if (targetLi.tagName.toLowerCase() === 'span') {
      targetLi = targetLi.parentElement!
    }

    if (targetLi.classList.contains('disabled')) {
      return
    }

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

    if (selectedLi && !selectedLi.contains(targetLi)) {
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

  buildMenu(menu: ToolbarMenu, additionalClasses?: string): TemplateResult {
    return html`
      <li class="toolbar-menu ${additionalClasses}" @click="${this.handleItemClick}"
          @mouseenter="${this.handleMouseEnter}">
        <span>${menu.text}</span>
        <ul class="toolbar-menu-items">
          ${menu.items.map(item => {
            if (item === ToolbarUiElement.DIVIDER) {
              return html`
                <hr/>`
            } else if ('items' in item) {
              return this.buildMenu(item, 'toolbar-menu-item')
            } else {
              let selected = item.selected

              if (typeof selected === 'function') {
                selected = selected()
              }

              let disabled = item.disabled

              if (typeof disabled === 'function') {
                disabled = disabled()
              }

              let bold = item.bold

              if (typeof bold === 'function') {
                bold = bold()
              }

              let onClick = undefined

              if (item.action) {
                onClick = (event: Event) => this.handleToolbarMenuItemClick(event, item.action!)
              }

              return html`
                <li class="toolbar-menu-item ${disabled ? 'disabled' : ''} ${selected ? 'selected' : ''} ${menu.selectedStyle}"
                    @click="${disabled ? nothing : onClick}">
                  <span data-command="${item.shortcut || nothing}"
                        class="${bold ? 'bold' : ''}">${item.text}
                  </span>
                </li>
              `
            }
          })}
        </ul>
      </li>
    `
  }

  render() {
    return html`
      <div class="toolbar-container">
        <menu @click="${() => this.closeAll()}">
          ${this.toolbarSpec.map(item => this.buildMenu(item))}
        </menu>
        ${this.logo
            ? html`
              <div class="logo-container">
                <img src="${this.logo}"/>
              </div>`
            : nothing}

      </div>
    `
  }
}
