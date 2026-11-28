import {type EpkIcon, IconViewMode} from "../icon.ts";
import {customElement, property, query, queryAll, state} from "lit/decorators.js";
import {css, html, nothing, type TemplateResult} from "lit";
import {
  type FolderNode,
  getFileLinkNodes,
  getFolderLinkNodes,
  getFormattedTimestamp,
  getLinkName,
  type LinkNode,
  linkNodeToIcon,
  LinkNodeType
} from "../../lib/fs.ts";
import {Task} from "@lit/task";
import {GalleryIcon} from "../icons/gallery-icon.ts";
import {FileExplorerIcon} from "../icons/file-explorer-icon.ts";
import {alertDialog, playSound, SystemSound} from "../../lib/os.ts";
import {launchEvent, windowPropertyChangeEvent} from "../../lib/events.ts";
import {AppAbout} from "./dialog/about.ts";
import {type ToolbarMenu, ToolbarSelectionStyle, ToolbarUiElement} from "../ui/toolbar.ts";
import {Explorer} from "./common/explorer.ts";
import {DEFAULT_WINDOW_ICON, FileViewer} from "./common/file-viewer.ts";
import type {Dimensions} from "../window.ts";

const TH_PADDING = 15

enum SortColumn {
  Filename = 'filename',
  Modified = 'modified'
}

@customElement('file-explorer')
export class FileExplorer extends FileViewer(Explorer<string>) {
  static styles = [
    ...Explorer.styles,
    css`
      .file-list {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        overflow: auto;
      }

      .selected {
        span {
          background-color: #316AC5;
          color: #ffffff;

          &:hover {
            color: #ffffff;
            text-decoration: underline;
            text-decoration-color: #ffffff;
          }
        }

        &.unfocused span {
          background-color: #ece9d8;
        }
      }

      .sort {
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

      .tree-item {
        list-style-type: none;
        width: max-content;
      }

      .tree-item-label {
        align-items: center;
        display: flex;
        gap: 4px;

        &:hover {
          color: #3f3f9f;
          text-decoration: underline;
        }

        & > span {
          padding: 2px;
        }
      }

      .tree-view {
        -webkit-font-smoothing: none;
        border: none;
        flex-grow: 1;
        overflow: auto;
      }

      col.selected {
        background-color: #f7f7f7;
      }

      table {
        border-collapse: collapse;
        table-layout: fixed;
      }

      td {
        padding: 0 2px;
        white-space: nowrap;

        &.spacer {
          height: 1px;
          width: 20ch;
        }
      }

      th {
        border-bottom: 3px solid #cfc9bb;
        font-weight: normal;
        padding: 5px 5px 5px 10px;
        text-align: start;
        white-space: nowrap;

        &:active {
          background-color: #dedfda;
        }

        &:not(.divider):hover {
          background-color: #f9f8f2;
          border-bottom-color: #f9ae13;
        }

        &.divider {
          padding: 0;

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
      }

      thead {
        background-color: #eceadb;
      }`
  ]

  @query('th[data-column=filename]')
  filenameHeader!: HTMLTableCellElement

  @query('th[data-column=modified]')
  modifiedHeader!: HTMLTableCellElement

  @queryAll('th')
  headers!: HTMLTableCellElement[]

  @queryAll('.epk-icon')
  icons!: EpkIcon[]

  @property({type: String})
  windowIcon = DEFAULT_WINDOW_ICON

  @property({type: String})
  windowTitle = 'File Explorer'

  @state()
  showSidebar = true

  @state()
  sortAsc = true

  @state()
  sortColumn = SortColumn.Filename

  @state()
  tree?: object

  private treeOpenPaths: { [path: string]: boolean } = {}
  private selectedIcon?: EpkIcon

  protected toolbarSpec: ToolbarMenu[] = [
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
              this.selectedIcon!.launch()
            } else {
              this.navigate(linkNode.physicalPath)
            }
          }
        },
        {
          text: 'Explore',
          disabled: () => this.selectedIcon?.fileLinkNode?.type !== LinkNodeType.Folder,
          action: () => {
            this.dispatchEvent(launchEvent(() => {
              const fileExplorer = new FileExplorer()
              fileExplorer.path = this.selectedIcon!.fileLinkNode!.physicalPath
              return fileExplorer
            }))
          }
        },
        ToolbarUiElement.DIVIDER,
        {text: 'Delete', disabled: true},
        {text: 'Rename', disabled: true},
        ToolbarUiElement.DIVIDER,
        this.toolbarCloseItem,
      ],
    },
    {
      text: 'View',
      items: [
        this.toolbarViewToolbarsItem,
        this.toolbarViewStatusBarItem,
        ToolbarUiElement.DIVIDER,
        {
          text: 'Arrange Icons by',
          selectedStyle: ToolbarSelectionStyle.RADIO,
          items: [
            {
              text: 'Name',
              selected: () => this.sortColumn === SortColumn.Filename,
              action: () => this.sortFiles(this.filenameHeader)
            },
            {
              text: 'Modified',
              selected: () => this.sortColumn === SortColumn.Modified,
              action: () => this.sortFiles(this.modifiedHeader)
            }
          ],
        },
        ToolbarUiElement.DIVIDER,
        this.toolbarViewGoToItems([{
          text: 'Up One Level',
          disabled: () => !this.canGoUp(),
          action: this.goUp.bind(this),
        }]),
        {
          text: 'Refresh',
          action: () => this.requestUpdate(),
        }
      ],
    },
    this.toolbarHelpMenu('Windows', () => {
      const about = this.spawnDialog(AppAbout)
      about.appName = 'Microsoft &reg; Windows'
      about.windowTitle = 'About Windows'
      return about
    })
  ]

  private treeLoaderTask = new Task(this, {
    task: async ([_, src]) => {
      if (!this.tree) {
        const treeResponse = await fetch(src)

        if (!treeResponse.ok) {
          alertDialog(this, 'Error', 'Failed to load file system tree.')
          this.tree = {}
        } else {
          this.tree = await treeResponse.json()
        }
      }

      return [this.icons, this.tree]
    },
    args: () => [this.iconLoaderTask.value, '/data/_folders.json']
  })

  getMinimumDimensions(): Partial<Dimensions> {
    return {width: 256, height: 256}
  }

  protected async onLoadIcons(path: string): Promise<FolderNode> {
    await super.onLoadIcons(path)
    this.windowIcon = this.folderNode!.metadata?.icon?.small || DEFAULT_WINDOW_ICON
    this.dispatchEvent(windowPropertyChangeEvent({thumbnail: this.windowIcon}))
    return this.folderNode!
  }

  protected navigate(newPath: string): void {
    if (this.path.replace(/\\?$/, '') === newPath.replace(/\\?$/, '')) {
      return
    }

    playSound(SystemSound.Click).then(() => {
      this.path = newPath
      this.pathStack.push(newPath)
    })
  }

  protected getNavigationButtons() {
    return html`
      <button type="button" id="upButton" class="tool-button" ?disabled="${!this.canGoUp()}"
              @click="${this.goUp}">
        <img src="/img/file-explorer/up.png"/>
      </button>
      <div class="divider"></div>
      <button type="button" id="treeView"
              class="tool-button ${this.showSidebar ? 'active' : ''}"
              @click="${() => this.showSidebar = !this.showSidebar}">
        <img src="/img/file-explorer/tree-view.png"/>
        <span>Folders</span>
      </button>`
  }

  protected getAddressBar() {
    return html`
      <img src="${this.folderNode?.metadata?.icon?.small || DEFAULT_WINDOW_ICON}"/>
      <input type="text" .value="${`${this.folderNode?.path}\\`}" id="pathInput"/>`
  }

  protected getSidebarContent() {
    return html`
      <ul class="tree-view">
        ${this.buildFileTree(this.tree, '')}
      </ul>`
  }

  protected getMainContent() {
    return html`
      <div class="file-list">
        <table>
          <colgroup>
            <col
                class="${this.sortColumn === SortColumn.Filename ? 'selected' : ''}"/>
            <col/>
            <col
                class="${this.sortColumn === SortColumn.Modified ? 'selected' : ''}"/>
          </colgroup>
          <thead>
          <tr>
            <th class="sort asc" data-column="${SortColumn.Filename}"
                @click="${(event: PointerEvent) => this.sortFiles(event.target as HTMLTableCellElement)}">
              File Name
            </th>
            <th class="divider" @mousedown="${this.handleDividerDrag}">
              <div></div>
            </th>
            <th data-column="${SortColumn.Modified}"
                @click="${(event: PointerEvent) => this.sortFiles(event.target as HTMLTableCellElement)}">
              Date Modified
            </th>
          </tr>
          </thead>
          <tbody>
          ${this.folderNode ? getFolderLinkNodes(this.folderNode).map(linkNode => html`
            <tr>
              <td>${this.buildIcon(linkNode)}</td>
              <td class="divider"></td>
              <td class="spacer">
              </td>
            </tr>
          `) : nothing}
          ${this.folderNode ? getFileLinkNodes(this.folderNode).map(linkNode => html`
            <tr>
              <td>${this.buildIcon(linkNode)}</td>
              <td class="divider"></td>
              <td>${getFormattedTimestamp(linkNode)}</td>
            </tr>
          `) : nothing}
          </tbody>
        </table>
      </div>`
  }

  protected getStatusBarFields() {
    return html`
      <p class="status-bar-field">${this.folderNode?.links.length} item(s)</p>`
  }

  private buildFileTree(tree: any, currentPath: string): TemplateResult | TemplateResult[] {
    return Object.keys(tree).filter(folder => folder !== '.' && folder !== '$').map(folder => {
      let nextPath = currentPath

      if (nextPath) {
        nextPath += '\\'
      }

      nextPath += folder

      const metadata = tree[folder].$
      const icon = metadata?.icon?.small || '/img/explorer/folder-closed.png'
      const nextIsTerminalFolder = !Object.keys(tree[folder]).filter(f => f !== '.' && f !== '$').length
      const cwdIsNext = this.path.replace(/\\$/, '') === nextPath.replace(/\\$/, '')

      if (nextIsTerminalFolder) {
        return html`
          <li class="tree-item ${cwdIsNext ? 'selected' : ''}"
              @click="${() => this.navigate(nextPath)}">
            <div class="tree-item-label">
              <img src="${icon}"/>
              <span>${folder}</span>
            </div>
          </li>`
      } else {
        return html`
          <li class="tree-item">
            <details
                ?open="${this.treeOpenPaths[nextPath] || this.path.startsWith(`${nextPath}\\`) || cwdIsNext}"
                @toggle="${(event: ToggleEvent) => this.treeOpenPaths[nextPath] = event.newState === 'open'}">
              <summary
                  class="tree-item ${cwdIsNext ? 'selected' : ''}"
                  @click="${() => this.navigate(nextPath)}">
                <div class="tree-item-label">
                  <img src="${icon}"/>
                  <span>${metadata?.alias || folder}</span>
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

  private buildIcon(path: LinkNode): EpkIcon {
    const icon = linkNodeToIcon(path)

    if (icon instanceof GalleryIcon) {
      (icon as GalleryIcon).fsSpecPath = this.path
    } else if (icon instanceof FileExplorerIcon) {
      icon.ondblclick = () => this.navigate(icon.fileLinkNode!.physicalPath)
    }

    icon.viewMode = IconViewMode.List

    icon.onclick = () => {
      this.selectedIcon = icon
      this.toolbar?.requestUpdate()
    }

    if (path.metadata?.icon) {
      icon.icon = {
        small: path.metadata.icon.small || icon.icon.small,
        large: path.metadata.icon.large || icon.icon.large,
      }
    }

    return icon
  }

  protected handleClick(event: Event): void {
    const target = event.target as HTMLElement

    if (target !== this.toolbar) {
      this.toolbar!.closeAll()
      Array.from(this.icons).filter(i => i !== target).forEach(i => i.selected = false)
    }

    if (!Array.from(this.icons).some(icon => icon.selected)) {
      const wasNull = this.selectedIcon !== null
      this.selectedIcon = undefined

      if (wasNull) {
        this.toolbar?.requestUpdate()
      }
    }

    const selectedTreeItem = this.shadowRoot?.querySelector('.tree-item.selected')

    if (selectedTreeItem) {
      if (selectedTreeItem === event.target || selectedTreeItem.contains(target)) {
        selectedTreeItem.classList.remove('unfocused')
      } else if (target.classList.contains('tree-item')) {
        selectedTreeItem.classList.remove('selected')
      } else {
        selectedTreeItem.classList.add('unfocused')
      }
    }
  }

  private sortFiles(target: HTMLTableCellElement): void {
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

        this.folderNode?.links.sort(sortAlphabetical)

        break
      case SortColumn.Modified:
        this.folderNode?.links.sort(
          this.sortAsc
            ? (a, b) => (a.metadata?.timestamp || 0) - (b.metadata?.timestamp || 0)
            : (a, b) => (b.metadata?.timestamp || 0) - (a.metadata?.timestamp || 0)
        )

        break
    }
  }

  private handleDividerDrag(mouseDownEvent: MouseEvent): void {
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
      precedingHeader.style.width = `${startWidth + deltaX - TH_PADDING}px`
    })
  }

  render() {
    return this.treeLoaderTask.render({
      pending: () => html`
        <div class="app">
          <div class="content">Loading...</div>
        </div>`,
      complete: () => super.render() as TemplateResult<1>,
      error: () => html`
        <div class="app">
          <div class="content">Error</div>
        </div>`
    })!
  }
}