import {type EpkIcon, IconViewMode} from "../icon.ts";
import {customElement, property, queryAll, state} from "lit/decorators.js";
import {css, html, type TemplateResult} from "lit";
import {getFormattedTimestamp, getLinkName, type LinkNode, linkNodeToIcon, LinkNodeType} from "../../lib/fs.ts";
import {Task} from "@lit/task";
import {GalleryIcon} from "../icons/gallery-icon.ts";
import {FileExplorerIcon} from "../icons/file-explorer-icon.ts";
import {alertDialog, playClick} from "../../lib/os.ts";
import {launchEvent} from "../../lib/events.ts";
import {AppAbout} from "./dialog/about.ts";
import {type ToolbarMenu, ToolbarSelectionStyle, ToolbarUiElement} from "../ui/toolbar.ts";
import {Explorer} from "./common/explorer.ts";
import {FileViewer} from "./common/file-viewer.ts";

enum SortColumn {
  Filename = 'filename',
  Modified = 'modified'
}

@customElement('file-explorer')
export class FileExplorer extends FileViewer(Explorer<string>) {
  static styles = [
    ...Explorer.styles,
    css`
      #sidebar > ul {
        border: none;
        flex-grow: 1;
        overflow: auto;
      }

      .file-list {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        overflow: auto;
      }

      .tree-item {
        list-style-type: none;
        width: max-content;

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
      }`
  ]

  @queryAll('.epk-icon')
  icons!: EpkIcon[]

  @queryAll('th')
  headers!: HTMLTableCellElement[]

  @property({type: String})
  windowTitle = 'File Explorer'

  @property({type: String})
  windowIcon = '/img/icons/small/file-explorer-small.ico'

  @state()
  showSidebar = true

  @state()
  sortAsc = true

  @state()
  sortColumn = SortColumn.Filename

  @state()
  tree?: object

  private treeOpenPaths: { [path: string]: boolean } = {}
  private selectedIcon: EpkIcon | null = null

  toolbarSpec: ToolbarMenu[] = [
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
              this.navigate(linkNode.physicalPath)
            }
          }
        },
        {
          text: 'Explore',
          disabled: () => this.selectedIcon?.fileLinkNode?.type !== LinkNodeType.Folder,
          action: () => {
            const fileExplorer = new FileExplorer()
            fileExplorer.path = this.selectedIcon!.fileLinkNode!.physicalPath
            this.dispatchEvent(launchEvent(() => new Promise<FileExplorer>(resolve => resolve(fileExplorer))))
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
        this.toolbarViewGoToItems([{
          text: 'Up One Level',
          disabled: () => !this.canGoUp(),
          action: () => this.goUp(),
        }]),
        {
          text: 'Refresh',
          action: () => this.requestUpdate(),
        }
      ],
    },
    this.toolbarHelpMenu('Windows', () => {
      const about = new AppAbout()
      about.appName = 'Microsoft &reg; Windows'
      about.windowTitle = 'About Windows'
      about.delegatingAppId = this.getAppId()
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

  private buildIcon(path: LinkNode): EpkIcon {
    const icon = linkNodeToIcon(path)

    if (icon instanceof GalleryIcon) {
      (icon as GalleryIcon).fsSpecPath = this.path
    } else if (icon instanceof FileExplorerIcon) {
      icon.handleDblClick = () => this.navigate(icon.fileLinkNode!.physicalPath)
    }

    icon.viewMode = IconViewMode.ListView

    icon.onclick = () => {
      this.selectedIcon = icon
      this.toolbar?.requestUpdate()
    }

    return icon
  }

  getMinimumDimensions(): [number, number] {
    return [256, 256]
  }

  navigate(newPath: string) {
    if (this.path.replace(/\\?$/, '') === newPath.replace(/\\?$/, '')) {
      return
    }

    playClick().then(() => {
      this.path = newPath
      this.pathStack.push(newPath)
    })
  }

  handleClick(event: Event) {
    super.handleClick(event)
    const target = event.target as HTMLElement

    if (target.id !== 'toolbar') {
      Array.from(this.icons).filter(i => i !== target).forEach(i => i.selected = false)
    }

    if (!Array.from(this.icons).some(icon => icon.selected)) {
      const wasNull = this.selectedIcon !== null
      this.selectedIcon = null

      if (wasNull) {
        this.toolbar?.requestUpdate()
      }
    }

    const selectedTreeItem = this.shadowRoot?.querySelector('.tree-item.selected')

    if (selectedTreeItem) {
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

        this.folderNode?.folderLinks.sort(sortAlphabetical)
        this.folderNode?.fileLinks.sort(sortAlphabetical)

        break
      case SortColumn.Modified:
        this.folderNode?.fileLinks.sort(
          this.sortAsc
            ? (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
            : (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
        )

        break
    }
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
      const cwdIsNext = this.path.replace(/\\$/, '') === nextPath.replace(/\\$/, '')

      let icon: string

      switch (folder) {
        case 'C:':
          icon = '/img/file-explorer/disk.ico'
          break
        case 'My Music':
          icon = '/img/icons/small/my-music-small.ico'
          break
        case 'My Pictures':
          icon = '/img/icons/small/my-pictures-small.ico'
          break
        case 'My Videos':
          icon = '/img/icons/small/my-videos-small.ico'
          break
        default:
          icon = '/img/explorer/folder-closed.png'
      }

      if (nextIsString) {
        return html`
          <li class="tree-item ${cwdIsNext ? 'selected' : ''}"
              @click="${() => this.navigate(nextPath)}">
            <div>
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
                <div>
                  <img src="${icon}"/>
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

  getNavigationButtons() {
    return html`
      <button type="button" id="upButton" class="style-2" ?disabled="${!this.canGoUp()}"
              @click="${this.goUp}">
        <img src="/img/file-explorer/up.png"/>
      </button>
      <div class="divider"></div>
      <button type="button" id="treeView"
              class="style-2 ${this.showSidebar ? 'active' : ''}"
              @click="${() => this.showSidebar = !this.showSidebar}">
        <img src="/img/file-explorer/tree-view.png"/>
        <span>Folders</span>
      </button>`
  }

  getAddressBar() {
    return html`
      <img src="${this.windowIcon}"/>
      <input type="text" .value="${this.folderNode?.path}" id="pathInput"/>`
  }

  getSidebarContent() {
    return html`
      <ul class="tree-view">
        ${this.buildFileTree(this.tree, '')}
      </ul>`
  }

  getMainContent() {
    return html`
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
          ${this.folderNode?.folderLinks.map(linkNode => html`
            <tr>
              <td>${this.buildIcon(linkNode)}</td>
              <td class="divider"></td>
              <td>
                <div class="spacer"></div>
              </td>
            </tr>
          `)}
          ${this.folderNode?.fileLinks.map(linkNode => html`
            <tr>
              <td>${this.buildIcon(linkNode)}</td>
              <td class="divider"></td>
              <td>${getFormattedTimestamp(linkNode)}</td>
            </tr>
          `)}
          </tbody>
        </table>
      </div>`
  }

  getStatusBarFields() {
    return html`
      <p class="status-bar-field">
        ${(this.folderNode?.folderLinks.length || 0) + (this.folderNode?.fileLinks.length || 0)} item(s)
      </p>`
  }

  render() {
    return this.treeLoaderTask.render({
      pending: () => html`
        <div class="app">
          <div class="content"></div>
        </div>`,
      complete: () => super.render() as TemplateResult<1>,
      error: () => html`
        <div class="app">
          <div class="content">Error</div>
        </div>`
    })!
  }
}