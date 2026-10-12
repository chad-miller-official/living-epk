import {customElement, property, query, queryAll, state} from "lit/decorators.js";
import {EpkApp} from "../app.ts";
import {css, html} from "lit";
import {Task} from "@lit/task";
import {buildIcon, type FsPath, type FsSpec, getFileName, loadFsSpec} from "../../lib/fs.ts";
import {EpkIcon, IconViewMode} from "../icon.ts";
import {closeWindowEvent} from "../../lib/events.ts";

export type FileTypeFilter = {
  regex: string,
  label: string,
  selected?: boolean,
}

@customElement('file-picker')
export class FilePicker extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    css`
      #fileExplorer {
        display: grid;
        grid-auto-flow: column;
        grid-template-rows: repeat(auto-fill, minmax(16px, 1fr));
        height: 97%;
        
        * {
          width: max-content;
        }
      }

      .controls {
        align-items: center;
        display: grid;
        grid-column-gap: 32px;
        grid-row-gap: 2px;
        grid-template-columns: auto 3fr auto;
        user-select: none;
      }

      .file-explorer-container {
        background-color: #ffffff;
        border: 1px solid #7f9db9;
        height: 100%;
        overflow-x: scroll;
      }

      .viewport {
        display: flex;
        flex-direction: column;
        gap: 8px;
        height: calc(100% - 16px);
        margin: 8px;
      }
    `
  ]

  @query('#fileExplorer')
  fileExplorer!: HTMLDivElement

  @queryAll('.epk-icon')
  icons!: EpkIcon[]

  @property({type: String})
  fsSpecPath!: string

  @property({type: Object})
  fileTypeFilters?: FileTypeFilter[]

  @property({type: String})
  windowTitle = 'Open'

  @property({type: String})
  windowIcon = null

  @state()
  filterRegex?: RegExp

  @state()
  fsSpec?: FsSpec

  @state()
  selectedFile?: FsPath

  onFilePick!: (filePath: FsPath) => void

  private iconLoaderTask = new Task(this, {
    task: async ([src], {signal}) => {
      try {
        this.fsSpec = await loadFsSpec(src, signal)
      } catch (ex: unknown) {
        // TODO this should bring up a Windows XP-style alert
        alert(ex instanceof Error ? ex.message : String(ex))
        this.fsSpec = {} as FsSpec
      }

      return this.fsSpec
    },
    args: () => [this.fsSpecPath]
  })

  getMinimumDimensions(): [number, number] {
    return [375, 275]
  }

  handleClick(event: Event) {
    if (event.target instanceof EpkIcon) {
      const target = event.target as EpkIcon
      this.selectedFile = target.filePath
      Array.from(this.icons).filter(i => i !== target).forEach(i => i.selected = false)
    } else if (event.target === this.fileExplorer) {
      this.selectedFile = undefined
      Array.from(this.icons).forEach(i => i.selected = false)
    }
  }

  handleDblClick(event: PointerEvent) {
    if (event.target instanceof EpkIcon && Array.from(this.icons).includes(event.target)) {
      this.handleFilePick((event.target as EpkIcon).filePath)
    }
  }

  private handleFilePick(path?: FsPath) {
    if (!path) {
      return
    }

    this.onFilePick(path)
    this.dispatchEvent(closeWindowEvent())
  }

  handleFileTypeFilterChange(event: Event) {
    this.filterRegex = new RegExp((event.target as HTMLOptionElement).value)

    if (this.selectedFile && !this.filterRegex.test(this.selectedFile.path)) {
      this.selectedFile = undefined
    }
  }

  private buildIcon(path: FsPath) {
    const icon = buildIcon(path)

    icon.viewMode = IconViewMode.ListView
    icon.selected = path.path === this.selectedFile?.path

    icon.handleDblClick = () => {
      // XXX hack to prevent default double-click behavior
    }

    return icon
  }

  render() {
    return this.iconLoaderTask.render({
      pending: () => html`
        <div class="app">
          <div class="content"></div>
        </div>`,
      complete: (spec: FsSpec) => {
        let files = spec.paths

        if (this.filterRegex) {
          files = files.filter(path => this.filterRegex!.test(path.path))
        }

        return html`
          <div class="app" @click="${this.handleClick}" @dblclick="${this.handleDblClick}">
            <div class="content">
              <div class="viewport">
                <input id="pathInput" type="text" value="${spec.displayRoot}"/>
                <div class="file-explorer-container">
                  <div id="fileExplorer">
                    ${files.map(this.buildIcon.bind(this))}
                  </div>
                </div>
                <div class="controls">
                  <span>File name:</span>
                  <input type="text" value="${this.selectedFile ? getFileName(this.selectedFile) : ''}" readonly/>
                  <button type="button"
                          @click="${() => this.handleFilePick(this.selectedFile)}">
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