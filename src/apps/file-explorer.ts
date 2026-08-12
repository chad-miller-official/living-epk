import {EpkApp} from "./base.ts";
import {EpkIconList} from "../components/icon-list.ts";
import {EpkToolbar} from "../components/toolbar.ts";
import type {EpkIcon} from "../components/icon.ts";
import {FileExplorerToolbar} from "../components/user/file-explorer-toolbar.ts";

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