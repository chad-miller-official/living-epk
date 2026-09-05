import {EpkToolbar} from "../ui.ts";
import type {EpkIcon} from "../icon.ts";
import {customElement, property, query} from "lit/decorators.js";
import type {ToolbarMenu} from "../../lib/toolbar.ts";
import {css, html} from "lit";
import {getFileExtension} from "../../lib/fs.ts";
import {MusicIcon} from "../icons/music-icon.ts";
import {MarkdownIcon} from "../icons/markdown-icon.ts";
import {Task} from "@lit/task";
import {EpkApp} from "../app.ts";

type FsPath = {
  path: string,
  displayPath: string,
}

type FsSpec = {
  displayRoot: string,
  paths: FsPath[],
}

@customElement('file-explorer')
export class FileExplorer extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    css`
      .file-explorer {
        align-items: flex-start;
        background-color: #ffffff;
        display: flex;
        gap: 16px;
        height: 100%;
        overflow: auto;
      }
    `
  ]

  @property({type: String})
  windowTitle = 'File Explorer'

  @property({type: String})
  windowIcon = '/img/795.ico'

  @property({type: String})
  filePath = '/data/my-documents.json'

  @query('#toolbar')
  toolbar!: EpkToolbar

  private toolbarSpec: ToolbarMenu[] = [
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

  private iconLoaderTask = new Task(this, {
    task: async ([src], {signal}) => {
      const response = await fetch(src, {signal})

      if (!response.ok) {
        // TODO this should bring up a Windows XP-style alert
        alert(`Failed to get file system data (tried loading "${src}")`)
      }

      return await response.json() as FsSpec
    },
    args: () => [this.filePath]
  })

  private buildIcon(path: FsPath) {
    const extension = getFileExtension(path.path)
    let icon: EpkIcon

    switch (extension) {
      case 'wav':
        icon = new MusicIcon()
        break
      case 'md':
        icon = new MarkdownIcon()
        break
      default:
        // TODO this should raise an alert box
        throw new Error(`Unhandled extension: ${extension}`)
    }

    icon.title = path.displayPath
    icon.filePath = path.path
    icon.classList.add('epk-icon')

    return icon
  }

  handleClick(event: Event) {
    if (event.target !== this.toolbar) {
      this.toolbar.closeAll()
    }
  }

  render() {
    return this.iconLoaderTask.render({
      pending: () => html`
        <div class="app">
          <div class="content"></div>
        </div>`,
      complete: (spec: FsSpec) => html`
        <div class="app" @click="${this.handleClick}">
          <epk-toolbar id="toolbar" class="toolbar" .toolbarSpec="${this.toolbarSpec}"></epk-toolbar>
          <section class="content file-explorer">
            ${spec.paths.map(this.buildIcon)}
          </section>
          <div class="status-bar">
            <p class="status-bar-field">${spec.paths.length} item(s)</p>
          </div>
        </div>`,
      error: () => html`
        <div class="app">
          <div class="content">Error</div>
        </div>`
    })
  }
}