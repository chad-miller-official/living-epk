import {customElement, property, query, state} from "lit/decorators.js";
import {css, html} from "lit";
import {
  type FolderNode,
  getFileLinkNodes,
  getFolderLinkNodes,
  getLinkName,
  type LinkNode,
  linkNodeToIcon,
  LinkNodeType
} from "../../../lib/fs.ts";
import {EpkIcon, IconViewMode} from "../../icon.ts";
import {filePickedEvent} from "../../../lib/events.ts";
import {EpkApp} from "../../app.ts";
import {PathStack} from "../../../lib/path-stack.ts";
import {EXTENDED_UI_STYLE} from "../../ui/styles.ts";
import {DEFAULT_WINDOW_ICON, FileViewer} from "../common/file-viewer.ts";
import {Dialog} from "./dialog.ts";
import {playSound, SystemSound} from "../../../lib/os.ts";
import type {Dimensions} from "../../window.ts";

export type FileTypeFilter = {
  regex: string,
  label: string,
  selected?: boolean,
}

export interface FilePickedHandler {
  handleFilePicked(linkNode?: LinkNode): void
}

@customElement('file-picker')
export class FilePicker extends Dialog(FileViewer(EpkApp)) {
  static styles = [
    ...EpkApp.styles,
    EXTENDED_UI_STYLE,
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
        grid-row-gap: 2px;
        height: 97%;
        margin-left: 2px;

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
        border: none;
        flex-grow: 1;
      }

      .address-bar {
        align-items: center;
        background-color: #ffffff;
        border: 1px solid #7f9db9;
        display: flex;
        margin-right: 10px;
        padding-left: 3px;
        width: 100%;
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
      }`
  ]

  @query('#fileExplorer')
  fileExplorer!: HTMLDivElement

  @query('#pathInput')
  pathInput!: HTMLInputElement

  @property({type: Object})
  fileTypeFilters?: FileTypeFilter[]

  @property({type: String})
  path!: string

  @property({type: String})
  windowIcon = null

  @property({type: String})
  windowTitle = 'Open'

  @state()
  filterRegex?: RegExp

  @state()
  selectedFileLinkNode?: LinkNode

  private pathStack = new PathStack<string>()

  getMinimumDimensions(): Partial<Dimensions> {
    return {width: 400, height: 300}
  }

  protected navigate(newPath: string) {
    if (this.path.replace(/\\?$/, '') !== newPath.replace(/\\?$/, '')) {
      playSound(SystemSound.Click).then(() => {
        this.path = newPath
        this.pathStack.push(newPath)
      })
    }
  }

  close(): void {
    if (this.delegatingAppId && this.selectedFileLinkNode) {
      this.dispatchEvent(filePickedEvent({
        targetAppId: this.delegatingAppId,
        fileLinkNode: this.selectedFileLinkNode,
      }))
    }

    super.close()
  }

  private buildIcon(path: LinkNode): EpkIcon {
    const icon = linkNodeToIcon(path)

    icon.viewMode = IconViewMode.List
    icon.selected = path.physicalPath === this.selectedFileLinkNode?.physicalPath

    icon.ondblclick = path.type === LinkNodeType.File
      ? () => this.handlePick()
      : () => this.navigate(path.physicalPath)

    return icon
  }

  protected handleClick(event: Event): void {
    super.handleClick(event)

    if (event.target instanceof EpkIcon) {
      this.selectedFileLinkNode = (event.target as EpkIcon).fileLinkNode
    } else if (event.target === this.fileExplorer) {
      this.selectedFileLinkNode = undefined
    }
  }

  private handleNavigate(event: SubmitEvent) {
    event.preventDefault()
    this.navigate(this.pathInput.value)
  }

  private handleFileTypeFilterChange(event: Event) {
    this.filterRegex = new RegExp((event.target as HTMLOptionElement).value)

    if (this.selectedFileLinkNode && !this.filterRegex.test(this.selectedFileLinkNode.physicalPath)) {
      this.selectedFileLinkNode = undefined
    }
  }

  private handlePick(): void {
    if (this.selectedFileLinkNode?.type === LinkNodeType.Folder) {
      this.navigate(this.selectedFileLinkNode.physicalPath)
    } else {
      this.close()
    }
  }

  private handleCancel() {
    this.selectedFileLinkNode = undefined
    this.close()
  }

  render() {
    return this.iconLoaderTask.render({
      pending: () => html`
        <div class="app" @click="${this.handleClick}">
          <div class="content">
            <div class="viewport">
              <div class="look-in">Look in:</div>
              <div class="navigation">
                <div class="address-bar">
                  <img src="${this.folderNode?.metadata?.icon?.small || DEFAULT_WINDOW_ICON}"/>
                  <input id="pathInput" type="text"/>
                </div>
                <button type="submit" id="goButton" class="tool-button">
                  <img src="/img/explorer/go.png"/>
                  <span>Go</span>
                </button>
                <div class="divider"></div>
                <button type="button" id="backButton" class="tool-button" disabled>
                  <img src="/img/explorer/back.png"/>
                </button>
                <button type="button" id="upButton" class="tool-button" disabled>
                  <img src="/img/file-explorer/up.png"/>
                </button>
              </div>
              <div class="shortcuts">
                <button type="button" class="tool-button" disabled>
                  <img src="/img/icons/file-explorer.ico"/>
                  <span>My Documents</span>
                </button>
                <button type="button" class="tool-button" disabled>
                  <img src="/img/icons/my-pictures.ico"/>
                  <span>My Pictures</span>
                </button>
                <button type="button" class="tool-button" disabled>
                  <img src="/img/icons/my-music.ico"/>
                  <span>My Music</span>
                </button>
                <button type="button" class="tool-button" disabled>
                  <img src="/img/icons/my-videos.ico"/>
                  <span>My Videos</span>
                </button>
              </div>
              <div class="file-explorer-container">
                <div id="fileExplorer">Loading...</div>
              </div>
              <div class="controls">
                <span>File name:</span>
                <input type="text" readonly/>
                <button type="button">Open</button>
                <span>Files of type:</span>
                <select>
                  <option value=".*">All Files</option>
                  ${this.fileTypeFilters?.map(filter => html`
                    <option value="${filter.regex}" ?selected="${filter.selected}">
                      ${filter.label}
                    </option>`)}
                </select>
                <button type="button">Cancel</button>
              </div>
            </div>
          </div>`,
      complete: (folderNode: FolderNode) => {
        let files = getFileLinkNodes(folderNode)

        if (this.filterRegex) {
          files = files.filter(path => this.filterRegex!.test(path.physicalPath))
        }

        return html`
          <div class="app" @click="${this.handleClick}">
            <div class="content">
              <div class="viewport">
                <div class="look-in">Look in:</div>
                <form class="navigation" @submit="${this.handleNavigate}">
                  <div class="address-bar">
                    <img src="${this.folderNode?.metadata?.icon?.small || DEFAULT_WINDOW_ICON}"/>
                    <input id="pathInput" type="text" value="${`${folderNode.path}\\`}"/>
                  </div>
                  <button type="submit" id="goButton" class="tool-button">
                    <img src="/img/explorer/go.png"/>
                    <span>Go</span>
                  </button>
                  <div class="divider"></div>
                  <button type="button" id="backButton" class="tool-button"
                          ?disabled="${!this.pathStack.canGoBack()}"
                          @click="${this.pathStack.goBack}">
                    <img src="/img/explorer/back.png"/>
                  </button>
                  <button type="button" id="upButton" class="tool-button" ?disabled="${!this.canGoUp()}"
                          @click="${this.goUp}">
                    <img src="/img/file-explorer/up.png"/>
                  </button>
                </form>
                <div class="shortcuts">
                  <button type="button" class="tool-button"
                          @click="${() => this.navigate('C:\\Users\\Chad\\My Documents')}">
                    <img src="/img/icons/file-explorer.ico"/>
                    <span>My Documents</span>
                  </button>
                  <button type="button" class="tool-button"
                          @click="${() => this.navigate('C:\\Users\\Chad\\My Pictures')}">
                    <img src="/img/icons/my-pictures.ico"/>
                    <span>My Pictures</span>
                  </button>
                  <button type="button" class="tool-button"
                          @click="${() => this.navigate('C:\\Users\\Chad\\My Music')}">
                    <img src="/img/icons/my-music.ico"/>
                    <span>My Music</span>
                  </button>
                  <button type="button" class="tool-button"
                          @click="${() => this.navigate('C:\\Users\\Chad\\My Videos')}">
                    <img src="/img/icons/my-videos.ico"/>
                    <span>My Videos</span>
                  </button>
                </div>
                <div class="file-explorer-container">
                  <div id="fileExplorer">
                    ${getFolderLinkNodes(folderNode).map(this.buildIcon.bind(this))}
                    ${files.map(this.buildIcon.bind(this))}
                  </div>
                </div>
                <div class="controls">
                  <span>File name:</span>
                  <input type="text"
                         value="${this.selectedFileLinkNode && this.selectedFileLinkNode.type === LinkNodeType.File
                             ? getLinkName(this.selectedFileLinkNode)
                             : ''}"
                         readonly/>
                  <button type="button" @click="${this.handlePick}">Open</button>
                  <span>Files of type:</span>
                  <select @change="${this.handleFileTypeFilterChange}">
                    <option value=".*">All Files</option>
                    ${this.fileTypeFilters?.map(filter => html`
                      <option value="${filter.regex}" ?selected="${filter.selected}">
                        ${filter.label}
                      </option>`)}
                  </select>
                  <button type="button" @click="${this.handleCancel}">Cancel</button>
                </div>
              </div>
            </div>`
      },
      error: () => html`
        <div class="app" @click="${this.handleClick}">
          <div class="content">
            <div class="viewport">
              <div class="look-in">Look in:</div>
              <div class="navigation">
                <div class="address-bar">
                  <img src="${this.folderNode?.metadata?.icon?.small || DEFAULT_WINDOW_ICON}"/>
                  <input id="pathInput" type="text"/>
                </div>
                <button type="submit" id="goButton" class="tool-button">
                  <img src="/img/explorer/go.png"/>
                  <span>Go</span>
                </button>
                <div class="divider"></div>
                <button type="button" id="backButton" class="tool-button" disabled>
                  <img src="/img/explorer/back.png"/>
                </button>
                <button type="button" id="upButton" class="tool-button" disabled>
                  <img src="/img/file-explorer/up.png"/>
                </button>
              </div>
              <div class="shortcuts">
                <button type="button" class="tool-button" disabled>
                  <img src="/img/icons/file-explorer.ico"/>
                  <span>My Documents</span>
                </button>
                <button type="button" class="tool-button" disabled>
                  <img src="/img/icons/my-pictures.ico"/>
                  <span>My Pictures</span>
                </button>
                <button type="button" class="tool-button" disabled>
                  <img src="/img/icons/my-music.ico"/>
                  <span>My Music</span>
                </button>
                <button type="button" class="tool-button" disabled>
                  <img src="/img/icons/my-videos.ico"/>
                  <span>My Videos</span>
                </button>
              </div>
              <div class="file-explorer-container">
                <div id="fileExplorer">Error</div>
              </div>
              <div class="controls">
                <span>File name:</span>
                <input type="text" readonly/>
                <button type="button">Open</button>
                <span>Files of type:</span>
                <select>
                  <option value=".*">All Files</option>
                  ${this.fileTypeFilters?.map(filter => html`
                    <option value="${filter.regex}" ?selected="${filter.selected}">
                      ${filter.label}
                    </option>`)}
                </select>
                <button type="button">Cancel</button>
              </div>
            </div>
          </div>`
    })
  }
}