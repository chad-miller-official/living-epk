import {customElement, property, state} from "lit/decorators.js";
import {styleMap} from "lit/directives/style-map.js";
import {css, type CSSResultGroup, html, LitElement} from "lit";
import {launchEvent} from "../lib/events.ts";
import {EpkWindow} from "./window.ts";
import {EpkIconList} from "./icon-list.ts";

export abstract class EpkIcon extends LitElement {
  static styles: CSSResultGroup = css`
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
  image = ''

  @property({type: String})
  color = '#000000'

  @state()
  selected = false

  abstract createWindow(): EpkWindow

  handleClick() {
    this.selected = true
  }

  handleDblClick() {
    this.dispatchEvent(launchEvent(this.createWindow))
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
        <img src="${this.image}" alt="${this.image}" width="48" height="48"/>
        <span class="${className}" style="${styleMap(textStyle)}">
          <slot>Untitled</slot>
        </span>
      </div>
    `
  }
}

@customElement('my-documents-icon')
export class MyDocumentsIcon extends EpkIcon {
  private static ICONS = ['123.mp3', '456.mp3']
  private static TOOLBAR_ITEMS = ['File', 'Edit', 'View', 'Help']

  createWindow(): EpkWindow {
    const epkWindow = new EpkWindow()
    epkWindow.title = 'My Documents'
    epkWindow.thumbnail = '/img/795.ico'

    const toolbarItems = MyDocumentsIcon.TOOLBAR_ITEMS.map(item => {
      const toolbarItem = document.createElement('li')
      toolbarItem.innerText = item
      toolbarItem.slot = 'toolbar'
      toolbarItem.classList.add('toolbar-item')
      return toolbarItem
    })

    const fileExplorer = new EpkIconList()

    fileExplorer.append(...MyDocumentsIcon.ICONS.map(fileName => {
      const icon = new MusicIcon()
      icon.image = '/img/1135.ico'
      icon.innerText = fileName
      icon.classList.add('epk-icon')
      return icon
    }))

    const itemCount = document.createElement('p')
    itemCount.classList.add('status-bar-field')
    itemCount.innerText = `${MyDocumentsIcon.ICONS.length} item(s)`
    itemCount.slot = 'status-bar'

    epkWindow.append(...toolbarItems, fileExplorer, itemCount)
    return epkWindow
  }
}

@customElement('music-icon')
export class MusicIcon extends EpkIcon {
  createWindow(): EpkWindow {
    const epkWindow = new EpkWindow()
    epkWindow.title = "Music Tape's"
    epkWindow.thumbnail = '/img/1137.ico'
    epkWindow.width = 312

    const audioContainer = document.createElement('div')

    const audio = document.createElement('audio')
    audio.controls = true

    const source = document.createElement('source')
    source.src = '/audio/weirdcore2.wav'
    source.type = 'audio/wav'

    audio.appendChild(source)
    audioContainer.appendChild(audio)
    epkWindow.append(audioContainer)

    return epkWindow
  }
}