import {EpkApp} from "./base.ts";
import {EpkIconList} from "../components/icon-list.ts";
import {MusicIcon} from "../components/user/icons.ts";
import {type ToolbarItem, ToolbarUiElement} from "../lib/toolbar.ts";
import {EpkToolbar} from "../components/toolbar.ts";
import {customElement} from "lit/decorators.js";

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
  private static ICONS = ['123.mp3', '456.mp3']

  windowTitle = ''
  windowIcon = '/img/795.ico'

  constructor(windowTitle: string) {
    super()
    this.windowTitle = windowTitle
  }

  getToolbar(): EpkToolbar {
    return new FileExplorerToolbar()
  }

  getWindowContents(): HTMLElement[] {
    const fileExplorer = new EpkIconList()

    fileExplorer.append(...FileExplorer.ICONS.map(fileName => {
      const icon = new MusicIcon(fileName)
      icon.classList.add('epk-icon')
      return icon
    }))

    return [fileExplorer]
  }

  getStatusBarItems(): HTMLParagraphElement[] {
    const itemCount = document.createElement('p')
    itemCount.innerText = `${FileExplorer.ICONS.length} item(s)`
    return [itemCount]
  }
}