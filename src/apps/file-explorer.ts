import {EpkApp} from "./base.ts";
import {EpkStatusBar, EpkToolbar} from "../components/ui.ts";
import type {EpkIcon} from "../components/icon.ts";
import {customElement, property, state} from "lit/decorators.js";
import type {ToolbarMenu} from "../lib/toolbar.ts";
import {css, html, LitElement, unsafeCSS} from "lit";
import {getFileExtension} from "../lib/fs.ts";
import {MusicIcon} from "../components/user/music-icon.ts";
import {HtmlIcon} from "../components/user/html-icon.ts";
import xpStyle from "xp.css/dist/XP.css?inline";

type FsPath = {
  path: string,
  displayPath: string,
}

type FsSpec = {
  displayRoot: string,
  paths: FsPath[],
}

@customElement('file-explorer-toolbar')
export class FileExplorerToolbar extends EpkToolbar {
  getToolbarSpec(): ToolbarMenu[] {
    return [
      {
        text: 'File',
        items: [],
      },
      {
        text: 'Edit',
        items: [],
      },
      {
        text: 'View',
        items: [],
      },
      {
        text: 'Favorites',
        items: [],
      },
      {
        text: 'Tools',
        items: [],
      },
      {
        text: 'Help',
        items: [],
      }
    ]
  }
}

@customElement('file-explorer-list')
export class FileExplorerList extends LitElement {
  static styles = [
    unsafeCSS(xpStyle),
    css`
      .file-explorer {
        background-color: #ffffff;
        height: 100%;

        &.icon-list {
          align-items: flex-start;
          display: flex;
          gap: 16px;
          overflow: auto;
        }
      }
    `
  ]
  @state()
  icons: EpkIcon[] = []

  render() {
    this.icons.forEach(icon => icon.classList.add('epk-icon'))

    return html`
      <section class="file-explorer icon-list">
        ${this.icons}
      </section>
    `
  }
}

@customElement('file-explorer-status-bar')
export class FileExplorerStatusBar extends EpkStatusBar {
  @property({type: Number})
  fileCount = 0

  render() {
    return html`
      <div class="status-bar">
        <p class="status-bar-field">${this.fileCount} item(s)</p>
      </div>
    `
  }
}

@customElement('file-explorer')
export class FileExplorer extends EpkApp {
  windowIcon = '/img/795.ico'
  windowTitle = ''

  filePath: string | undefined

  private _toolbar: FileExplorerToolbar | null = null
  private _fileList: FileExplorerList | undefined
  private _statusBar: FileExplorerStatusBar | null = null

  constructor(filePath?: string) {
    super()
    this.filePath = filePath
  }

  connectedCallback() {
    super.connectedCallback()

    this._toolbar = new FileExplorerToolbar()
    this._fileList = new FileExplorerList()
    this._statusBar = new FileExplorerStatusBar()

    const filePath = this.filePath || '/data/my-documents.json'

    fetch(filePath).then(response => {
      if (!response.ok) {
        // TODO this should bring up a Windows XP-style alert
        alert(`Failed to get file system data (tried loading "${filePath}")`)
      }

      response.json().then((fsData: FsSpec) => {
        this._fileList!.icons = fsData.paths.map(path => {
          const extension = getFileExtension(path.path)
          let icon: EpkIcon

          switch (extension) {
            case 'wav':
              icon = new MusicIcon()
              break
            case 'html':
              icon = new HtmlIcon()
              break
            default:
              // TODO this should raise an alert box
              throw new Error(`Unhandled extension: ${extension}`)
          }

          icon.title = path.displayPath
          icon.filePath = path.path

          return icon
        })
      })
    })
  }

  getToolbar(): EpkToolbar | null {
    return this._toolbar
  }

  getWindowContents(): LitElement {
    return this._fileList!
  }

  getStatusBar(): EpkStatusBar | null {
    return this._statusBar
  }
}