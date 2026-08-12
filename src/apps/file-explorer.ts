import {EpkApp} from "./base.ts";
import {EpkIconList} from "../components/icon-list.ts";
import {type ToolbarItem, ToolbarUiElement} from "../lib/toolbar.ts";
import {EpkToolbar} from "../components/toolbar.ts";
import {customElement} from "lit/decorators.js";
import type {EpkIcon} from "../components/icon.ts";

@customElement('file-explorer-toolbar')
class FileExplorerToolbar extends EpkToolbar {
  getToolbarSpec(): ToolbarItem[] {
    return [
      {
        text: 'File',
        items: [
          {
            text: 'Open',
            shortcut: 'Ctrl+O',
            action: () => {
              alert('Hi lol')
            },
          },
          {
            text: 'Schwongle',
            shortcut: 'Ctrl+Q',
            action: () => {
              alert('glub')
            },
          },
          ToolbarUiElement.DIVIDER,
          {
            text: 'Exit',
            action: () => {
              alert('Close')
            }
          }
        ],
      },
      {
        text: 'Edit',
        items: [
          {
            text: 'Thingy',
            action: () => {
              alert('fgsfds')
            },
          },
        ],
      },
      {
        text: 'View',
        items: [],
      },
      {
        text: 'Help',
        items: [],
      }
    ]
  }
}

export class FileExplorer extends EpkApp {
  icons: EpkIcon[] = []
  windowTitle = ''
  windowIcon = '/img/795.ico'

  constructor(windowTitle: string, windowIcon: string, ...icons: EpkIcon[]) {
    super()
    this.windowTitle = windowTitle
    this.windowIcon = windowIcon
    this.icons = icons
  }

  getToolbar(): EpkToolbar {
    return new FileExplorerToolbar()
  }

  getWindowContents(): HTMLElement[] {
    const fileExplorer = new EpkIconList()

    this.icons.forEach(icon => icon.classList.add('epk-icon'))
    fileExplorer.append(...this.icons)

    return [fileExplorer]
  }

  getStatusBarItems(): HTMLParagraphElement[] {
    const itemCount = document.createElement('p')
    itemCount.innerText = `${this.icons.length} item(s)`
    return [itemCount]
  }
}