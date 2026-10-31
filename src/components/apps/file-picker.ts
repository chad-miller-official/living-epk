import {customElement, property, query, state} from "lit/decorators.js";
import {css, html} from "lit";
import {Task} from "@lit/task";
import {
  type FolderNode,
  getLinkName,
  getParentFolder,
  type LinkNode,
  linkNodeToIcon,
  LinkNodeType
} from "../../lib/fs.ts";
import {EpkIcon, IconViewMode} from "../icon.ts";
import {closeWindowEvent} from "../../lib/events.ts";
import {BaseFileViewer} from "./file-viewer.ts";

export type FileTypeFilter = {
  regex: string,
  label: string,
  selected?: boolean,
}

@customElement('file-picker')
export class FilePicker extends BaseFileViewer {
  static styles = [
    ...BaseFileViewer.styles,
    css`
      #backButton, #upButton {
        img {
          width: 15px;
        }
      }

      #fileExplorer {
        display: grid;
        grid-auto-flow: column;
        grid-template-rows: repeat(auto-fill, minmax(16px, 1fr));
        height: 97%;

        * {
          width: max-content;
        }
      }

      #goButton {
        display: flex;
        gap: 7px;
        height: 100%;
        padding: 0 8px 0 4px;
      }

      #pathInput {
        margin-right: 10px;
      }

      .controls {
        align-items: center;
        display: grid;
        grid-area: controls;
        grid-column-gap: 32px;
        grid-row-gap: 8px;
        grid-template-columns: auto 3fr auto;
        user-select: none;
      }

      .file-explorer-container {
        background-color: #ffffff;
        border: 1px solid #7f9db9;
        grid-area: file-explorer;
        height: 100%;
        overflow-x: scroll;
      }

      .look-in {
        align-self: center;
        grid-area: look-in;
        justify-self: end;
      }

      .navigation {
        display: flex;
        grid-area: navigation;
        margin-right: 48px;
      }

      .shortcuts {
        background-color: #f9f8f3;
        display: flex;
        filter: drop-shadow(1px 1px 1px #cac7b9);
        flex-direction: column;
        padding: 2px;
        grid-area: shortcuts;

        & > button {
          flex-direction: column;
          gap: 8px;
          height: 70px;
          justify-content: flex-start;
          max-height: 70px;
          max-width: 78px;
          padding: 4px;
          width: 78px;

          & > img {
            width: 32px;
          }
        }
      }

      .viewport {
        -webkit-font-smoothing: none;
        box-sizing: border-box;
        display: grid;
        font-family: "Pixelated MS Sans Serif", Arial;
        font-size: 11px;
        gap: 8px;
        grid-template-areas:
          "look-in navigation"
          "shortcuts file-explorer"
          "shortcuts controls";
        grid-template-columns: auto 1fr;
        grid-template-rows: auto 1fr;
        height: 100%;
        user-select: none;
        padding: 8px;
      }
    `
  ]

  @query('#fileExplorer')
  fileExplorer!: HTMLDivElement

  @property({type: Object})
  fileTypeFilters?: FileTypeFilter[]

  @property({type: String})
  windowTitle = 'Open'

  @property({type: String})
  windowIcon = null

  @state()
  filterRegex?: RegExp

  @state()
  selectedFileLinkNode?: LinkNode

  onFilePick!: (fileLinkNode: LinkNode) => void

  private iconLoaderTask = new Task(this, {
    task: async ([src]) => {
      const icons = await this.loadIcons(src)

      if (icons) {
        this.folderNode = icons
      }

      return this.folderNode
    },
    args: () => [this.folderNodeJsonPath]
  })

  getMinimumDimensions(): [number, number] {
    return [400, 300]
  }

  handleClick(event: Event) {
    super.handleClick(event)

    if (event.target instanceof EpkIcon) {
      this.selectedFileLinkNode = (event.target as EpkIcon).fileLinkNode
    } else if (event.target === this.fileExplorer) {
      this.selectedFileLinkNode = undefined
    }
  }

  private handleFilePick(fileLinkNode?: LinkNode) {
    if (!fileLinkNode) {
      return
    }

    this.onFilePick(fileLinkNode)
    this.dispatchEvent(closeWindowEvent())
  }

  handleFileTypeFilterChange(event: Event) {
    this.filterRegex = new RegExp((event.target as HTMLOptionElement).value)

    if (this.selectedFileLinkNode && !this.filterRegex.test(this.selectedFileLinkNode.path)) {
      this.selectedFileLinkNode = undefined
    }
  }

  private buildIcon(path: LinkNode): EpkIcon {
    const icon = linkNodeToIcon(path)

    icon.viewMode = IconViewMode.ListView
    icon.selected = path.path === this.selectedFileLinkNode?.path

    icon.handleDblClick = path.type === LinkNodeType.File
      ? () => this.handleFilePick(icon.fileLinkNode)
      : () => this.navigate(path.path)

    return icon
  }

  render() {
    return this.iconLoaderTask.render({
      pending: () => html`
        <div class="app">
          <div class="content"></div>
        </div>`,
      complete: (folderNode: FolderNode) => {
        let files = folderNode.fileLinks

        if (this.filterRegex) {
          files = files.filter(path => this.filterRegex!.test(path.path))
        }

        const parentPath = getParentFolder(folderNode)

        return html`
          <div class="app" @click="${this.handleClick}">
            <div class="content">
              <div class="viewport">
                <div class="look-in">Look in:</div>
                <form class="navigation" @submit="${this.handlePathInputSubmit}">
                  <input id="pathInput" type="text" value="${folderNode.path}"/>
                  <button type="submit" id="goButton" class="style-2">
                    <img src="/img/file-explorer/go.png"/>
                    <span>Go</span>
                  </button>
                  <div class="divider"></div>
                  <button type="button" id="backButton" class="style-2"
                          ?disabled="${this.pathStackIdx === 0}" @click="${this.goBack}">
                    <img src="/img/file-explorer/back.png"/>
                  </button>
                  <button type="button" id="upButton" class="style-2" ?disabled="${!parentPath}"
                          @click="${() => this.navigate(parentPath)}">
                    <img src="/img/file-explorer/up.png"/>
                  </button>
                </form>
                <div class="shortcuts">
                  <button type="button" class="style-2"
                          @click="${() => this.navigate('C:\\Users\\Chad\\My Documents')}">
                    <img src="/img/file-explorer.ico"/>
                    <span>My Documents</span>
                  </button>
                  <button type="button" class="style-2"
                          @click="${() => this.navigate('C:\\Users\\Chad\\My Pictures')}">
                    <img src="/img/my-pictures.ico"/>
                    <span>My Pictures</span>
                  </button>
                  <button type="button" class="style-2"
                          @click="${() => this.navigate('C:\\Users\\Chad\\My Music')}">
                    <img src="/img/my-music.ico"/>
                    <span>My Music</span>
                  </button>
                </div>
                <div class="file-explorer-container">
                  <div id="fileExplorer">
                    ${folderNode.folderLinks.map(this.buildIcon.bind(this))}
                    ${files.map(this.buildIcon.bind(this))}
                  </div>
                </div>
                <div class="controls">
                  <span>File name:</span>
                  <input type="text"
                         value="${this.selectedFileLinkNode ? getLinkName(this.selectedFileLinkNode) : ''}"
                         readonly/>
                  <button type="button"
                          @click="${() => this.handleFilePick(this.selectedFileLinkNode)}">
                    Open
                  </button>
                  <span>Files of type:</span>
                  <select @change="${this.handleFileTypeFilterChange}">
                    <option value=".*">All Files</option>
                    ${this.fileTypeFilters?.map(filter => html`
                      <option value="${filter.regex}" ?selected="${filter.selected}">
                        ${filter.label}
                      </option>`)}
                  </select>
                  <button type="button" @click="${() => this.dispatchEvent(closeWindowEvent())}">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>`
      }
    })
  }
}