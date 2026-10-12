import {customElement, property, queryAll, state} from "lit/decorators.js";
import {EpkApp} from "../app.ts";
import {css, html} from "lit";
import {Task} from "@lit/task";
import {type FsPath, type FsSpec, getFileExtension, loadFsSpec} from "../../lib/fs.ts";
import {EpkIcon, IconViewMode} from "../icon.ts";
import {MusicIcon} from "../icons/music-icon.ts";
import {MarkdownIcon} from "../icons/markdown-icon.ts";
import {GalleryIcon} from "../icons/gallery-icon.ts";
import {closeWindowEvent} from "../../lib/events.ts";

@customElement('file-picker')
export class FilePicker extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    css`
      .controls {
        align-items: center;
        display: grid;
        grid-column-gap: 32px;
        grid-row-gap: 2px;
        grid-template-columns: auto 3fr auto;
        user-select: none;
      }

      .file-explorer {
        display: grid;
        grid-auto-flow: column;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        grid-template-rows: repeat(auto-fill, minmax(16px, 1fr));
        height: 97%;
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

  @queryAll('.epk-icon')
  icons!: EpkIcon[]

  @property({type: String})
  filePath!: string

  @property({type: String})
  windowTitle = 'Open'

  @property({type: String})
  windowIcon = null

  @state()
  fsSpec?: FsSpec

  @state()
  selectedFilePath?: string

  onFilePick!: (filePath: string) => void

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
    args: () => [this.filePath]
  })

  handleClick(event: Event) {
    if (event.target instanceof EpkIcon && Array.from(this.icons).includes(event.target)) {
      const target = event.target as EpkIcon
      this.selectedFilePath = target.filePath
    } else {
      this.selectedFilePath = undefined
    }

    Array.from(this.icons).filter(i => i !== event.target).forEach(i => i.selected = false)
  }

  handleDblClick(event: PointerEvent) {
    if (event.target instanceof EpkIcon && Array.from(this.icons).includes(event.target)) {
      this.handleFilePick((event.target as EpkIcon).filePath)
    }
  }

  private handleFilePick(path?: string) {
    if (!path) {
      return
    }

    this.onFilePick(path)
    this.dispatchEvent(closeWindowEvent())
  }

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
      case 'jpg':
        icon = new GalleryIcon()
        break
      default:
        // TODO this should raise an alert box
        throw new Error(`Unhandled extension: ${extension}`)
    }

    icon.title = path.displayPath
    icon.filePath = path.path
    icon.viewMode = IconViewMode.ListView
    icon.selected = path.path === this.selectedFilePath
    icon.classList.add('epk-icon')

    return icon
  }

  render() {
    return this.iconLoaderTask.render({
      pending: () => html`
        <div class="app">
          <div class="content"></div>
        </div>`,
      complete: (spec: FsSpec) => {
        return html`
          <div class="app" @click="${this.handleClick}" @dblclick="${this.handleDblClick}">
            <div class="content">
              <div class="viewport">
                <input id="pathInput" type="text" value="${spec.displayRoot}"/>
                <div class="file-explorer-container">
                  <div class="file-explorer">
                    ${spec.paths.map(this.buildIcon.bind(this))}
                  </div>
                </div>
                <div class="controls">
                  <span>File name:</span>
                  <select value="test">
                    <option>Test</option>
                  </select>
                  <button type="button"
                          @click="${() => this.handleFilePick(this.selectedFilePath)}">
                    Open
                  </button>
                  <span>Files of type:</span>
                  <select value="test">
                    <option>Test</option>
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