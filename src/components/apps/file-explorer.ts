import {type EpkIcon, IconViewMode} from "../icon.ts";
import {customElement, property, query, queryAll, state} from "lit/decorators.js";
import {css, html, type TemplateResult} from "lit";
import {
  type FolderNode,
  getFormattedTimestamp,
  getLinkName,
  type LinkNode,
  linkNodeToIcon,
  LinkNodeType
} from "../../lib/fs.ts";
import {Task} from "@lit/task";
import {styleMap} from "lit/directives/style-map.js";
import {GalleryIcon} from "../icons/gallery-icon.ts";
import {FileExplorerIcon} from "../icons/file-explorer-icon.ts";
import {alertDialog} from "../../lib/os.ts";
import {BaseFileViewer} from "./file-viewer.ts";
import {closeWindowEvent, DisallowFlags, launchEvent} from "../../lib/events.ts";
import {AppAbout} from "./about.ts";
import {type ToolbarMenu, ToolbarSelectionStyle, ToolbarUiElement} from "../ui/toolbar.ts";

enum SortColumn {
  Filename = 'filename',
  Modified = 'modified'
}

@customElement('file-explorer')
export class FileExplorer extends BaseFileViewer {
  static styles = [
    ...BaseFileViewer.styles,
    css`
      #closeButton {
        height: 18px;
        width: 18px;
      }

      #goButton {
        padding: 0 8px 0 4px;
      }

      #fileTree {
        flex-shrink: 0;
        min-width: 12ch;
        overflow: auto;

        & > ul {
          border: none;
          width: max-content;
        }
      }

      .address {
        opacity: 0.5;
        padding: 0 4px;
      }

      .explorer {
        background-color: #ffffff;
        display: flex;
        height: 100%;
      }

      .explorer-divider {
        background-color: #eee9d5;
        cursor: col-resize;
        min-width: 5px;
        max-width: 5px;
        width: 5px;
      }

      .file-list {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        overflow: auto;
      }

      .file-tree-header {
        align-items: center;
        background: linear-gradient(to right, #f3f4f7, #eee9d5);
        display: flex;
        justify-content: space-between;
        padding: 3px 7px;
      }

      .navigation {
        align-items: center;
        background-color: #eceadb;
        border-bottom: 1px groove #c7c5b2;
        display: flex;
        width: 100%;

        button {
          padding: 9px 7px;
          margin: 1px;
        }
      }

      .hidden {
        display: none;
      }

      .tree-item {
        list-style-type: none;
        width: fit-content;

        &.selected {
          &.unfocused span {
            background-color: #ece9d8;
          }

          &:not(.unfocused) span {
            background-color: #316AC5;
            color: #ffffff;

            &:hover {
              color: #ffffff;
            }
          }
        }

        & > div {
          align-items: center;
          display: flex;
          gap: 4px;

          & > span {
            padding: 2px;

            &:hover {
              color: #3f3f9f;
              text-decoration: underline;
            }
          }
        }
      }

      .selected-sort {
        background-color: #f7f7f7;
      }

      .viewport {
        -webkit-font-smoothing: none;
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

      td > div.spacer {
        height: 1px;
        width: 20ch;
      }

      td, th {
        padding: 0 2px;
        white-space: nowrap;
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
            margin-left: 1ch;
            white-space: pre;
          }

          &.asc::after {
            content: "\\25BC";
          }

          &.desc::after {
            content: "\\25B2";
          }
        }
      }

      th, thead {
        background-color: #eceadb;
      }
    `
  ]

  static fileTreeWidth = 160

  @queryAll('th')
  headers!: HTMLTableCellElement[]

  @query('#fileTree')
  fileTree!: HTMLDivElement

  @property({type: String})
  windowTitle = 'File Explorer'

  @property({type: String})
  windowIcon = '/img/file-explorer-small.ico'

  @state()
  sortAsc = true

  @state()
  sortColumn = SortColumn.Filename

  @state()
  showFileTree = true

  @state()
  showStandardButtons = true

  @state()
  showAddressBar = true

  @state()
  showStatusBar = true

  private treeOpenPaths: { [path: string]: boolean } = {}
  private selectedIcon: EpkIcon | null = null

  private toolbarSpec: ToolbarMenu[] = [
    {
      text: 'File',
      items: [
        {
          text: 'Open',
          bold: () => this.selectedIcon !== null,
          disabled: () => !this.selectedIcon,
          action: () => {
            const linkNode = this.selectedIcon!.fileLinkNode!

            if (linkNode.type === LinkNodeType.File) {
              this.selectedIcon!.handleDblClick()
            } else {
              this.navigate(linkNode.path)
            }
          }
        },
        {
          text: 'Explore',
          disabled: () => this.selectedIcon?.fileLinkNode?.type !== LinkNodeType.Folder,
          action: () => {
            const fileExplorer = new FileExplorer()
            fileExplorer.folderNodeJsonPath = this.selectedIcon!.fileLinkNode!.path
            this.dispatchEvent(launchEvent(() => new Promise<FileExplorer>(resolve => resolve(fileExplorer))))
          }
        },
        ToolbarUiElement.DIVIDER,
        {text: 'Delete', disabled: true},
        {text: 'Rename', disabled: true},
        ToolbarUiElement.DIVIDER,
        {text: 'Close', action: () => this.dispatchEvent(closeWindowEvent())},
      ],
    },
    {
      text: 'View',
      items: [
        {
          text: 'Toolbars',
          items: [
            {
              text: 'Standard Buttons',
              selected: () => this.showStandardButtons,
              action: () => this.showStandardButtons = !this.showStandardButtons,
            },
            {
              text: 'Address Bar',
              selected: () => this.showAddressBar,
              action: () => this.showAddressBar = !this.showAddressBar,
            },
          ],
        },
        {
          text: 'Status Bar',
          selected: () => this.showStatusBar,
          action: () => this.showStatusBar = !this.showStatusBar,
        },
        ToolbarUiElement.DIVIDER,
        {
          text: 'Arrange Icons by',
          selectedStyle: ToolbarSelectionStyle.RADIO,
          items: [
            {
              text: 'Name',
              selected: () => this.sortColumn === SortColumn.Filename,
              action: () => this.sortFiles({target: this.shadowRoot!.querySelector('th[data-column=filename]')!})
            },
            {
              text: 'Modified',
              selected: () => this.sortColumn === SortColumn.Modified,
              action: () => this.sortFiles({target: this.shadowRoot!.querySelector('th[data-column=modified]')!})
            }
          ],
        },
        ToolbarUiElement.DIVIDER,
        {
          text: 'Go To',
          items: [
            {
              text: 'Back',
              disabled: () => !this.canGoBack(),
              action: () => this.goBack(),
              shortcut: 'Alt+Left Arrow',
            },
            {
              text: 'Forward',
              disabled: () => !this.canGoForward(),
              action: () => this.goForward(),
              shortcut: 'Alt+Right Arrow',
            },
            {
              text: 'Up One Level',
              disabled: () => !this.canGoUp(),
              action: () => this.goUp(),
            },
          ]
        },
        {
          text: 'Refresh',
          action: () => this.requestUpdate(),
        }
      ],
    },
    {
      text: 'Help',
      items: [
        {
          text: 'About Windows',
          action: (event: Event) => {
            event.stopPropagation()
            this.toolbar!.closeAll()

            const about = new AppAbout()
            about.appName = 'Microsoft &reg; Windows'
            about.windowTitle = 'About Windows'

            this.dispatchEvent(launchEvent(() => new Promise<AppAbout>(resolve => resolve(about)), {
              width: 419,
              height: 350,
              disallowFlags: DisallowFlags.DisallowAll,
            }))
          },
        },
      ],
    }
  ]

  private treeLoaderTask = new Task(this, {
    task: async ([src]) => {
      const treeResponse = await fetch(src)

      if (!treeResponse.ok) {
        alertDialog(this, 'Error', 'Failed to load file system tree.')
        return {}
      }

      return treeResponse.json()
    },
    args: () => ['/data/_folders.json']
  })

  private iconLoaderTask = new Task(this, {
    task: async ([tree, src]) => {
      const icons = await this.loadIcons(src)

      if (icons) {
        this.folderNode = icons
      }

      return [tree, this.folderNode]
    },
    args: () => [this.treeLoaderTask.value, this.folderNodeJsonPath]
  })

  private buildIcon(path: LinkNode): EpkIcon {
    const icon = linkNodeToIcon(path)

    if (icon instanceof GalleryIcon) {
      (icon as GalleryIcon).fsSpecPath = this.folderNodeJsonPath
    } else if (icon instanceof FileExplorerIcon) {
      icon.handleDblClick = () => this.navigate(icon.fileLinkNode!.path)
    }

    icon.viewMode = IconViewMode.ListView

    icon.onclick = () => {
      this.selectedIcon = icon
      this.toolbar?.requestUpdate()
    }

    return icon
  }

  private goForward() {
    if (this.pathStackIdx < this.pathStack.length - 1) {
      this.playClick().then(() => {
        this.pathStackIdx++
        this.folderNodeJsonPath = this.pathStack[this.pathStackIdx]
      })
    }
  }

  handleClick(event: Event) {
    super.handleClick(event)

    if (!Array.from(this.icons).some(icon => icon.selected)) {
      const wasNull = this.selectedIcon !== null
      this.selectedIcon = null

      if (wasNull) {
        this.toolbar?.requestUpdate()
      }
    }

    const selectedTreeItem = this.shadowRoot?.querySelector('.tree-item.selected')

    if (selectedTreeItem) {
      const target = event.target as HTMLElement

      if (selectedTreeItem === event.target || selectedTreeItem.contains(target)) {
        selectedTreeItem.classList.remove('unfocused')
      } else {
        if (target.classList.contains('tree-item')) {
          selectedTreeItem.classList.remove('selected')
        } else {
          selectedTreeItem.classList.add('unfocused')
        }
      }
    }
  }

  sortFiles(event: { target: EventTarget | HTMLTableCellElement }) {
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

  private connectDividerDragListeners(handleMouseMove: (mouseMoveEvent: MouseEvent) => void) {
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  handlePrimaryDividerDrag(mouseDownEvent: MouseEvent) {
    const startX = mouseDownEvent.clientX
    const startWidth = this.fileTree.offsetWidth

    this.connectDividerDragListeners((mouseMoveEvent: MouseEvent) => {
      const deltaX = mouseMoveEvent.clientX - startX
      FileExplorer.fileTreeWidth = startWidth + deltaX
      this.requestUpdate()
    })
  }

  handleDividerDrag(mouseDownEvent: MouseEvent) {
    const divider = mouseDownEvent.target as HTMLElement

    const precedingHeader = (divider.tagName.toLowerCase() === 'div'
      ? divider.parentElement!.previousElementSibling
      : divider.previousElementSibling) as HTMLTableCellElement

    if (!precedingHeader) {
      return
    }

    const startX = mouseDownEvent.clientX
    const startWidth = precedingHeader.offsetWidth

    this.connectDividerDragListeners((mouseMoveEvent: MouseEvent) => {
      const deltaX = mouseMoveEvent.clientX - startX

      // Subtract 15 to account for padding within the <th> element
      precedingHeader.style.width = `${startWidth + deltaX - 15}px`
    })
  }

  buildFileTree(tree: any, currentPath: string): TemplateResult<1> | TemplateResult<1>[] {
    return Object.keys(tree).filter(folder => folder !== '.').map(folder => {
      let nextPath = currentPath

      if (nextPath) {
        nextPath += '\\'
      }

      nextPath += folder

      const nextIsString = typeof tree[folder] === 'string'
      const cwdIsNext = this.folderNodeJsonPath.replace(/\\$/, '') === nextPath.replace(/\\$/, '')

      let icon: string

      switch (folder) {
        case 'C:':
          icon = 'disk'
          break
        case 'My Music':
          icon = 'my-music'
          break
        case 'My Pictures':
          icon = 'my-pictures'
          break
        case 'My Videos':
          icon = 'my-videos'
          break
        default:
          icon = 'folder-closed'
      }

      if (nextIsString) {
        return html`
          <li class="tree-item ${cwdIsNext ? 'selected' : ''}"
              @click="${() => this.navigate(nextPath)}">
            <div>
              <img src="/img/file-explorer/${icon}.ico"/>
              <span>${folder}</span>
            </div>
          </li>`
      } else {
        return html`
          <li class="tree-item">
            <details
                ?open="${this.treeOpenPaths[nextPath] || this.folderNodeJsonPath.startsWith(`${nextPath}\\`) || cwdIsNext}"
                @toggle="${(event: ToggleEvent) => this.treeOpenPaths[nextPath] = event.newState === 'open'}">
              <summary
                  class="tree-item ${cwdIsNext ? 'selected' : ''}"
                  @click="${() => this.navigate(nextPath)}">
                <div>
                  <img src="/img/file-explorer/${icon}.ico"/>
                  <span>${folder === 'C:' ? 'Local Disk (C:)' : folder}</span>
                </div>
              </summary>
              <ul>
                ${this.buildFileTree(tree[folder], nextPath)}
              </ul>
            </details>
          </li>`
      }
    }).flat()
  }

  canGoForward() {
    return this.pathStackIdx !== this.pathStack.length - 1
  }

  render() {
    return this.iconLoaderTask.render({
      pending: () => html`
        <div class="app">
          <div class="content"></div>
        </div>`,
      complete: ([tree, folderNode]: readonly [any, FolderNode]) => {
        const fileTreeStyle: any = {width: `${FileExplorer.fileTreeWidth}px`}
        const primaryDividerStyle: any = {}

        if (!this.showFileTree) {
          fileTreeStyle.display = 'none'
          primaryDividerStyle.display = 'none'
        }

        return html`
          <div class="app" @click="${this.handleClick}">
            <epk-toolbar id="toolbar" .toolbarSpec="${this.toolbarSpec}"></epk-toolbar>
            <section class="content">
              <div class="viewport">
                <div class="navigation ${this.showStandardButtons ? '' : 'hidden'}">
                  <button type="button" id="backButton" class="style-2"
                          ?disabled="${!this.canGoBack()}" @click="${this.goBack}">
                    <img src="/img/file-explorer/back.png"/>
                    <span>Back</span>
                  </button>
                  <button type="button" id="forwardButton" class="style-2"
                          ?disabled="${!this.canGoForward()}" @click="${this.goForward}">
                    <img src="/img/file-explorer/forward.png"/>
                  </button>
                  <button type="button" id="upButton" class="style-2" ?disabled="${!this.canGoUp()}"
                          @click="${this.goUp}">
                    <img src="/img/file-explorer/up.png"/>
                  </button>
                  <div class="divider"></div>
                  <button type="button" id="treeView"
                          class="style-2 ${this.showFileTree ? 'active' : ''}"
                          @click="${() => this.showFileTree = !this.showFileTree}">
                    <img src="/img/file-explorer/tree-view.png"/>
                    <span>Folders</span>
                  </button>
                </div>
                <form class="navigation ${this.showAddressBar ? '' : 'hidden'}"
                      @submit="${this.handlePathInputSubmit}">
                  <span class="address">Address</span>
                  <input type="text" value="${folderNode.path}" id="pathInput"/>
                  <button type="submit" id="goButton" class="style-2">
                    <img src="/img/file-explorer/go.png"/>
                    <span>Go</span>
                  </button>
                </form>
                <div class="explorer">
                  <div id="fileTree" style="${styleMap(fileTreeStyle)}">
                    <div class="file-tree-header">
                      Folders
                      <button type="button" id="closeButton" class="style-2"
                              @click="${() => this.showFileTree = false}">
                        <img src="/img/file-explorer/x.png"/>
                      </button>
                    </div>
                    <ul class="tree-view">
                      ${this.buildFileTree(tree, '')}
                    </ul>
                  </div>
                  <div class="explorer-divider" style="${styleMap(primaryDividerStyle)}"
                       @mousedown="${this.handlePrimaryDividerDrag}"></div>
                  <div class="file-list">
                    <table>
                      <colgroup>
                        <col
                            class="${this.sortColumn === SortColumn.Filename ? 'selected-sort' : ''}"/>
                        <col/>
                        <col
                            class="${this.sortColumn === SortColumn.Modified ? 'selected-sort' : ''}"/>
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
                          Date Modified
                        </th>
                      </tr>
                      </thead>
                      <tbody>
                      ${folderNode.folderLinks.map(linkNode => html`
                        <tr>
                          <td>${this.buildIcon(linkNode)}</td>
                          <td class="divider"></td>
                          <td>
                            <div class="spacer"></div>
                          </td>
                        </tr>
                      `)}
                      ${folderNode.fileLinks.map(linkNode => html`
                        <tr>
                          <td>${this.buildIcon(linkNode)}</td>
                          <td class="divider"></td>
                          <td>${getFormattedTimestamp(linkNode)}</td>
                        </tr>
                      `)}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
            <div class="status-bar ${this.showStatusBar ? '' : 'hidden'}">
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