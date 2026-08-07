import {EpkApp} from "./base.ts";
import {EpkIconList} from "../components/icon-list.ts";
import {MusicIcon} from "../components/user/icons.ts";

export class FileExplorer extends EpkApp {
  private static ICONS = ['123.mp3', '456.mp3']
  private static TOOLBAR_ITEMS = ['File', 'Edit', 'View', 'Help']

  windowTitle = ''
  windowIcon = '/img/795.ico'

  constructor(windowTitle: string) {
    super()
    this.windowTitle = windowTitle
  }

  getToolbarItems(): HTMLLIElement[] {
    return FileExplorer.TOOLBAR_ITEMS.map(item => {
      const toolbarItem = document.createElement('li')
      toolbarItem.innerText = item
      return toolbarItem
    })
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