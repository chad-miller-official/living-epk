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
import {styleMap} from "lit/directives/style-map.js";

enum SortColumn {
  Filename = 'filename',
  Modified = 'modified'
}

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
        flex-direction: column;
        overflow: auto;
        width: 100%;
      }

      .navigation {
        display: flex;
      }

      .viewport {
        -webkit-font-smoothing: none;
        background-color: #ffffff;
        display: flex;
        flex-direction: column;
        font-family: "Pixelated MS Sans Serif", Arial;
        font-size: 11px;
        height: 100%;
        user-select: none;
      }

      table {
        border-collapse: collapse;
        table-layout: fixed;
      }

      td {
        white-space: nowrap;

        &:not(.divider) {
          padding: 0 4px;

        }
      }

      th {
        border-bottom: 3px solid #cfc9bb;
        font-weight: normal;
        text-align: start;

        &:not(.divider) {
          padding: 5px 5px 5px 10px;

          &:hover {
            background-color: #f9f8f2;
            border-bottom-color: #f9ae13;
          }

          &:active {
            background-color: #dedfda;
          }
        }

        &.divider {
          div {
            background-color: #ccc8b6;
            height: 14px;
            margin: auto;
            width: 1px;
          }

          &:hover {
            cursor: col-resize;
          }
        }

        &.sort {
          &::after {
            color: #aca797;
            white-space: pre;
          }

          &.asc::after {
            content: "    \\25BC";
          }

          &.desc::after {
            content: "    \\25B2";
          }
        }
      }

      th, thead {
        background-color: #eceadb;
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

  @queryAll('th')
  headers!: HTMLTableCellElement[]

  @state()
  fsSpec!: FsSpec

  @state()
  sortColumn = SortColumn.Filename

  @state()
  sortAsc = true

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

      this.fsSpec = await response.json() as FsSpec
      return this.fsSpec
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
    icon.viewMode = IconViewMode.ListView
    icon.classList.add('epk-icon')

    return icon
  }

  handleClick(event: Event) {
    if (event.target !== this.toolbar) {
      this.toolbar.closeAll()
    }

    Array.from(this.icons).filter(i => i !== event.target).forEach(i => i.selected = false)
  }

  sortFiles(event: Event) {
    const target = event.target as HTMLTableCellElement

    if (target.classList.contains('sort')) {
      if (target.classList.contains('asc')) {
        target.classList.remove('asc')
        target.classList.add('desc')
      } else {
        target.classList.remove('desc')
        target.classList.add('asc')
      }

      this.sortAsc = !this.sortAsc
    } else {
      this.headers.forEach(th => th.classList.remove('sort'))

      target.classList.add('sort')
      target.classList.add('asc')

      this.sortColumn = target.dataset['column'] as SortColumn
      this.sortAsc = true
    }

    switch (this.sortColumn) {
      case SortColumn.Filename:
        this.fsSpec.paths.sort(
          this.sortAsc
            ? (a, b) => a.displayPath.localeCompare(b.displayPath)
            : (a, b) => b.displayPath.localeCompare(a.displayPath)
        )

        break
      case SortColumn.Modified:
        this.fsSpec.paths.sort(
          this.sortAsc
            ? (a, b) => a.timestamp - b.timestamp
            : (a, b) => b.timestamp - a.timestamp
        )

        break
    }
  }

  handleDividerDrag(mouseDownEvent: MouseEvent) {
    const divider = mouseDownEvent.target as HTMLTableCellElement
    const precedingHeader = divider.previousElementSibling as HTMLTableCellElement

    const startX = mouseDownEvent.clientX
    const startWidth = precedingHeader.offsetWidth

    const handleMouseMove = (mouseMoveEvent: MouseEvent) => {
      const deltaX = mouseMoveEvent.clientX - startX

      // Subtract 15 to account for padding within the <th> element
      precedingHeader.style.width = `${startWidth + deltaX - 15}px`
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  render() {
    return this.iconLoaderTask.render({
      pending: () => html`
        <div class="app">
          <div class="content"></div>
        </div>`,
      complete: (spec: FsSpec) => {
        const LIST_VIEW_DATE_FORMAT_OPTIONS = {
          dateStyle: 'full',
          timeStyle: 'short',
        } as const

        const colStyle = styleMap({backgroundColor: '#f7f7f7'})

        return html`
          <div class="app" @click="${this.handleClick}">
            <epk-toolbar id="toolbar" class="toolbar"
                         .toolbarSpec="${this.toolbarSpec}"></epk-toolbar>
            <section class="content">
              <div class="viewport">
                <div class="navigation">
                  <input type="text" value="${spec.displayRoot}" id="pathInput"/>
                </div>
                <div class="file-explorer">
                  <table>
                    <colgroup>
                      <col style="${this.sortColumn === SortColumn.Filename ? colStyle : ''}"/>
                      <col/>
                      <col style="${this.sortColumn === SortColumn.Modified ? colStyle : ''}"/>
                    </colgroup>
                    <thead>
                    <tr>
                      <th class="sort asc" data-column="${SortColumn.Filename}" @click="${this.sortFiles}">
                        File Name
                      </th>
                      <th class="divider" @mousedown="${this.handleDividerDrag}">
                        <div></div>
                      </th>
                      <th data-column="${SortColumn.Modified}" @click="${this.sortFiles}">
                        Last Modified
                      </th>
                    </tr>
                    </thead>
                    <tbody>
                    ${spec.paths.map(path => html`
                      <tr>
                        <td>${this.buildIcon(path)}</td>
                        <td class="divider"></td>
                        <td>${new Intl.DateTimeFormat('en-US', LIST_VIEW_DATE_FORMAT_OPTIONS).format(path.timestamp)}
                        </td>
                      </tr>
                    `)}
                    </tbody>
                  </table>
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