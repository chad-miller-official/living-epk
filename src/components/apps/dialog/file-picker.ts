import {customElement, property, query, state} from "lit/decorators.js";
import {css, html} from "lit";
import {type FolderNode, getLinkName, type LinkNode, linkNodeToIcon, LinkNodeType} from "../../../lib/fs.ts";
import {EpkIcon, IconViewMode} from "../../icon.ts";
import {filePickedEvent} from "../../../lib/events.ts";
import {EpkApp} from "../../app.ts";
import {playClick} from "../../../lib/os.ts";
import {PathStack} from "../../../lib/path-stack.ts";
import {buttonStyle2} from "../../../lib/ui.ts";
import {FileViewer} from "../common/file-viewer.ts";
import {Dialog} from "./dialog.ts";

export type FileTypeFilter = {
  regex: string,
  label: string,
  selected?: boolean,
}

@customElement('file-picker')
export class FilePicker extends Dialog(FileViewer(EpkApp)) {
  static styles = [
    ...EpkApp.styles,
    buttonStyle2,
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
        flex-grow: 1;
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

  @query('#iconForm')
  iconForm!: HTMLFormElement

  @query('#pathInput')
  pathInput!: HTMLInputElement

  @property({type: Object})
  fileTypeFilters?: FileTypeFilter[]

  @property()
  path!: string

  @property({type: String})
  windowTitle = 'Open'

  @property({type: String})
  windowIcon = null

  @state()
  filterRegex?: RegExp

  @state()
  selectedFileLinkNode?: LinkNode

  pathStack = new PathStack<string>()

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

  close(event: SubmitEvent) {
    if (this.delegatingAppId && this.selectedFileLinkNode) {
      this.dispatchEvent(filePickedEvent(this.delegatingAppId, this.selectedFileLinkNode))
    }

    super.close(event)
  }

  handleFileTypeFilterChange(event: Event) {
    this.filterRegex = new RegExp((event.target as HTMLOptionElement).value)

    if (this.selectedFileLinkNode && !this.filterRegex.test(this.selectedFileLinkNode.physicalPath)) {
      this.selectedFileLinkNode = undefined
    }
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

  private buildIcon(path: LinkNode): EpkIcon {
    const icon = linkNodeToIcon(path)

    icon.viewMode = IconViewMode.ListView
    icon.selected = path.physicalPath === this.selectedFileLinkNode?.physicalPath

    icon.handleDblClick = path.type === LinkNodeType.File
      ? () => this.iconForm.requestSubmit()
      : () => this.navigate(path.physicalPath)

    return icon
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
        let files = folderNode.fileLinks

        if (this.filterRegex) {
          files = files.filter(path => this.filterRegex!.test(path.physicalPath))
        }

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
                          ?disabled="${!this.pathStack.canGoBack()}"
                          @click="${this.pathStack.goBack}">
                    <img src="/img/file-explorer/back.png"/>
                  </button>
                  <button type="button" id="upButton" class="style-2" ?disabled="${!this.canGoUp()}"
                          @click="${this.goUp}">
                    <img src="/img/file-explorer/up.png"/>
                  </button>
                </form>
                <div class="shortcuts">
                  <button type="button" class="style-2"
                          @click="${() => this.navigate('C:\\Users\\Chad\\My Documents')}">
                    <img src="/img/icons/file-explorer.ico"/>
                    <span>My Documents</span>
                  </button>
                  <button type="button" class="style-2"
                          @click="${() => this.navigate('C:\\Users\\Chad\\My Pictures')}">
                    <img src="/img/icons/my-pictures.ico"/>
                    <span>My Pictures</span>
                  </button>
                  <button type="button" class="style-2"
                          @click="${() => this.navigate('C:\\Users\\Chad\\My Music')}">
                    <img src="/img/icons/my-music.ico"/>
                    <span>My Music</span>
                  </button>
                </div>
                <div class="file-explorer-container">
                  <div id="fileExplorer">
                    ${folderNode.folderLinks.map(this.buildIcon.bind(this))}
                    ${files.map(this.buildIcon.bind(this))}
                  </div>
                </div>
                <form id="iconForm" class="controls" @submit="${this.close}">
                  <span>File name:</span>
                  <input type="text"
                         value="${this.selectedFileLinkNode ? getLinkName(this.selectedFileLinkNode) : ''}"
                         readonly/>
                  <button type="submit">Open</button>
                  <span>Files of type:</span>
                  <select @change="${this.handleFileTypeFilterChange}">
                    <option value=".*">All Files</option>
                    ${this.fileTypeFilters?.map(filter => html`
                      <option value="${filter.regex}" ?selected="${filter.selected}">
                        ${filter.label}
                      </option>`)}
                  </select>
                  <button type="submit">Cancel</button>
                </form>
              </div>
            </div>
          </div>`
      }
    })
  }
}