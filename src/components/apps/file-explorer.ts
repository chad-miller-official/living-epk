import {EpkToolbar} from "../ui.ts";
import {type EpkIcon, IconViewMode} from "../icon.ts";
import {customElement, property, query, queryAll, state} from "lit/decorators.js";
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
  timestamp: number,
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
      #pathInput {
        border-left: none;
        border-right: none;
        border-top: none;
        width: 100%;
      }

      .file-explorer {
        display: flex;
        overflow: auto;

        &.icon {
          align-items: flex-start;
        }
        
        &.list {
          flex-direction: column;
          width: 100%;
        }
      }

      .navigation {
        display: flex;
      }
      
      .viewport {
        background-color: #ffffff;
        display: flex;
        flex-direction: column;
        height: 100%;
      }
    `
  ]

  @property({type: String})
  windowTitle = 'File Explorer'

  @property({type: String})
  windowIcon = '/img/file-explorer-small.ico'

  @property({type: String})
  filePath = '/data/my-documents.json'

  @query('#toolbar')
  toolbar!: EpkToolbar

  @queryAll('.epk-icon')
  icons!: EpkIcon[]

  @state()
  viewMode = IconViewMode.IconView

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
      items: [
        {
          text: 'Icon View',
          action: () => this.viewMode = IconViewMode.IconView,
          selected: () => this.viewMode === IconViewMode.IconView
        },
        {
          text: 'List View',
          action: () => this.viewMode = IconViewMode.ListView,
          selected: () => this.viewMode === IconViewMode.ListView,
        }
      ],
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
    icon.timestamp = path.timestamp
    icon.classList.add('epk-icon')
    icon.viewMode = this.viewMode

    if (this.viewMode === IconViewMode.ListView) {
      icon.style.flexGrow = '1'
      icon.style.padding = '0 4px'
    }

    return icon
  }

  handleClick(event: Event) {
    if (event.target !== this.toolbar) {
      this.toolbar.closeAll()
    }

    Array.from(this.icons).filter(i => i !== event.target).forEach(i => i.selected = false)
  }

  render() {
    return this.iconLoaderTask.render({
      pending: () => html`
        <div class="app">
          <div class="content"></div>
        </div>`,
      complete: (spec: FsSpec) => {
        return html`
          <div class="app" @click="${this.handleClick}">
            <epk-toolbar id="toolbar" class="toolbar"
                         .toolbarSpec="${this.toolbarSpec}"></epk-toolbar>
            <section class="content">
              <div class="viewport">
                <div class="navigation">
                  <input type="text" value="${spec.displayRoot}" id="pathInput"/>
                </div>
                <div class="file-explorer ${this.viewMode}">
                  ${spec.paths.map(this.buildIcon.bind(this))}
                </div>
              </div>
            </section>
            <div class="status-bar">
              <p class="status-bar-field">${spec.paths.length} item(s)</p>
            </div>
          </div>`
      },
      error: () => html`
        <div class="app">
          <div class="content">Error</div>
        </div>`
    })
  }
}