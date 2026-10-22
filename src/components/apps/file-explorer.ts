import {type EpkIcon, IconViewMode} from "../icon.ts";
import {customElement, property, query, queryAll, state} from "lit/decorators.js";
import type {ToolbarMenu} from "../../lib/toolbar.ts";
import {css, html} from "lit";
import {
  type FolderNode,
  getFormattedTimestamp,
  getLinkName,
  type LinkNode,
  linkNodeToIcon,
  loadFolderNode
} from "../../lib/fs.ts";
import {Task} from "@lit/task";
import {EpkApp} from "../app.ts";
import {styleMap} from "lit/directives/style-map.js";
import {GalleryIcon} from "../icons/gallery-icon.ts";
import {FileExplorerIcon} from "../icons/file-explorer-icon.ts";
import {buttonStyle2} from "../ui.ts";

enum SortColumn {
  Filename = 'filename',
  Modified = 'modified'
}

@customElement('file-explorer')
export class FileExplorer extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    buttonStyle2,
    css`
      #backButton, #forwardButton {
        & > span {
          align-items: center;
          display: flex;
          gap: 8px;
          margin: 2px 4px;
        }
      }

      #goButton {
        display: flex;
        gap: 4px;
        height: 100%;
        padding: 0 8px 0 4px;
      }

      #pathInput {
        flex-grow: 1;
      }

      .address {
        opacity: 0.5;
        padding: 0 4px;
      }

      .file-explorer {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: auto;
        width: 100%;
      }

      .navigation {
        align-items: center;
        background-color: #eceadb;
        border-bottom: 1px groove #c7c5b2;
        display: flex;
        width: 100%;

        button {
          padding: 4px 7px;
          margin: 1px;

          &[disabled] > img {
            filter: grayscale(1);
            opacity: 0.5;
          }
        }

        .divider {
          background-color: #ccc8b6;
          height: 85%;
          margin: 2px;
          width: 1px;
        }
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

      td, th {
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
  folderNodeJsonPath!: string

  @queryAll('.epk-icon')
  icons!: EpkIcon[]

  @queryAll('th')
  headers!: HTMLTableCellElement[]

  @query('#pathInput')
  pathInput!: HTMLInputElement

  @state()
  folderNode!: FolderNode

  @state()
  sortColumn = SortColumn.Filename

  @state()
  sortAsc = true

  private pathStack: string[] = []
  private pathStackIdx = 0

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
      try {
        this.folderNode = await loadFolderNode(src, signal)
      } catch (ex: unknown) {
        // TODO this should bring up a Windows XP-style alert
        alert(ex instanceof Error ? ex.message : String(ex))
        this.folderNode = {path: src, folderLinks: [], fileLinks: []}
      }

      return this.folderNode
    },
    args: () => [this.folderNodeJsonPath]
  })

  private buildIcon(path: LinkNode) {
    const icon = linkNodeToIcon(path)

    if (icon instanceof GalleryIcon) {
      (icon as GalleryIcon).fsSpecPath = this.folderNodeJsonPath
    } else if (icon instanceof FileExplorerIcon) {
      icon.handleDblClick = () => this.navigate(icon.fileLinkNode!.path)
    }

    icon.viewMode = IconViewMode.ListView
    return icon
  }

  private navigate(newPath: string) {
    if (this.folderNodeJsonPath.replace(/\\?$/, '') === newPath.replace(/\\?$/, '')) {
      return
    }
    this.folderNodeJsonPath = newPath
    this.pathStackIdx++

    if (newPath !== this.pathStack[this.pathStackIdx]) {
      this.pathStack.length = this.pathStackIdx
      this.pathStack.push(newPath)
    }
  }

  private goBack() {
    if (this.pathStackIdx > 0) {
      this.pathStackIdx--
      this.folderNodeJsonPath = this.pathStack[this.pathStackIdx]
    }
  }

  private goForward() {
    if (this.pathStackIdx < this.pathStack.length - 1) {
      this.pathStackIdx++
      this.folderNodeJsonPath = this.pathStack[this.pathStackIdx]
    }
  }

  connectedCallback() {
    super.connectedCallback()
    this.pathStack.push(this.folderNodeJsonPath)
  }

  handleClick(event: Event) {
    super.handleClick(event)
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
        const sortAlphabetical = this.sortAsc
          ? (a: LinkNode, b: LinkNode) => getLinkName(a).localeCompare(getLinkName(b))
          : (a: LinkNode, b: LinkNode) => getLinkName(b).localeCompare(getLinkName(a))

        this.folderNode.folderLinks.sort(sortAlphabetical)
        this.folderNode.fileLinks.sort(sortAlphabetical)

        break
      case SortColumn.Modified:
        this.folderNode.fileLinks.sort(
          this.sortAsc
            ? (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
            : (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
        )

        break
    }
  }

  handleDividerDrag(mouseDownEvent: MouseEvent) {
    const divider = mouseDownEvent.target as HTMLElement
    let precedingHeader: HTMLTableCellElement

    if (divider.tagName === 'div') {
      precedingHeader = divider.parentElement!.previousElementSibling as HTMLTableCellElement
    } else {
      precedingHeader = divider.previousElementSibling as HTMLTableCellElement
    }

    if (!precedingHeader) {
      return
    }

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

  handlePathInputSubmit(event: SubmitEvent) {
    event.preventDefault()
    this.navigate(this.pathInput.value)
  }

  render() {
    return this.iconLoaderTask.render({
      pending: () => html`
        <div class="app">
          <div class="content"></div>
        </div>`,
      complete: (folderNode: FolderNode) => {
        const colStyle = styleMap({backgroundColor: '#f7f7f7'})

        const parentPathParts = folderNode.path.split('\\')
        parentPathParts.pop()

        const parentPath = parentPathParts.join('\\')

        return html`
          <div class="app" @click="${this.handleClick}">
            <epk-toolbar id="toolbar" .toolbarSpec="${this.toolbarSpec}"></epk-toolbar>
            <section class="content">
              <div class="viewport">
                <div class="navigation">
                  <button type="button" id="backButton" class="style-2"
                          ?disabled="${this.pathStackIdx === 0}" @click="${this.goBack}">
                    <img src="/img/file-explorer/back.png"/>
                    <span>Back</span>
                  </button>
                  <button type="button" id="forwardButton" class="style-2"
                          ?disabled="${this.pathStackIdx === this.pathStack.length - 1}"
                          @click="${this.goForward}">
                    <img src="/img/file-explorer/forward.png"/>
                  </button>
                  <button type="button" id="upButton" class="style-2"
                          ?disabled="${!parentPath}"
                          @click="${() => this.navigate(parentPath)}">
                    <img src="/img/file-explorer/up.png"/>
                  </button>
                  <div class="divider"></div>
                </div>
                <form class="navigation" @submit="${this.handlePathInputSubmit}">
                  <span class="address">Address</span>
                  <input type="text" value="${`${folderNode.path}\\`}" id="pathInput"/>
                  <button type="submit" id="goButton" class="style-2">
                    <img src="/img/file-explorer/go.png"/>
                    <span>Go</span>
                  </button>
                </form>
                <div class="file-explorer">
                  <table>
                    <colgroup>
                      <col style="${this.sortColumn === SortColumn.Filename ? colStyle : ''}"/>
                      <col/>
                      <col style="${this.sortColumn === SortColumn.Modified ? colStyle : ''}"/>
                    </colgroup>
                    <thead>
                    <tr>
                      <th class="sort asc" data-column="${SortColumn.Filename}"
                          @click="${this.sortFiles}">
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
                    ${folderNode.folderLinks.map(linkNode => html`
                      <tr>
                        <td>${this.buildIcon(linkNode)}</td>
                        <td class="divider"></td>
                        <td></td>
                      </tr>
                    `)}
                    ${folderNode.fileLinks.map(linkNode => html`
                      <tr>
                        <td>${this.buildIcon(linkNode)}</td>
                        <td class="divider"></td>
                        <td>${getFormattedTimestamp(linkNode)}
                        </td>
                      </tr>
                    `)}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
            <div class="status-bar">
              <p class="status-bar-field">
                ${folderNode.folderLinks.length + folderNode.fileLinks.length} item(s)
              </p>
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