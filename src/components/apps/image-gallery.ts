import {css, html} from "lit";
import {EpkApp} from "../app.ts";
import {customElement, property, query, state} from "lit/decorators.js";
import {type FolderNode, type LinkNode, loadFolderNode} from "../../lib/fs.ts";
import {Task, TaskStatus} from "@lit/task";
import Panzoom, {type PanzoomObject} from "@panzoom/panzoom";
import {styleMap} from "lit/directives/style-map.js";
import {extendedUiStyle} from "../../lib/ui.ts";
import {windowPropertyChangeEvent} from "../../lib/events.ts";
import {alertDialog} from "../../lib/os.ts";
import {WindowState} from "../window.ts";

@customElement('image-gallery')
export class ImageGallery extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    extendedUiStyle,
    css`
      .buttons {
        background-color: #eef2fb;
        display: flex;
        justify-content: center;

        &:not(.slideshow-controls) {
          gap: 5px;
          margin: 8px 8px;
        }

        &.slideshow-controls {
          gap: 2px;
          margin: 0;
        }
      }

      .image-wrapper {
        height: 100%;
        width: 100%;
      }

      .slideshow {
        background-color: #000000;
      }

      .slideshow-controls {
        opacity: 0;
        position: absolute;
        right: 0;
        top: 0;
        z-index: 10001;

        &:hover {
          opacity: 100%;
        }
      }

      .viewport {
        background-color: #eef2fb;
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
      }

      #image {
        background-position: center;
        background-repeat: no-repeat;
        background-size: contain;
        width: 100%;
        height: 100%;
      }
    `
  ]

  @query('#image')
  image!: HTMLImageElement

  @query('#play')
  playButton!: HTMLButtonElement

  @query('#pause')
  pauseButton!: HTMLButtonElement

  @property({type: String})
  windowTitle = 'Windows Picture and Fax Viewer'

  @property({type: String})
  windowIcon = '/img/icons/small/gallery-small.ico'

  @property({type: String})
  fileLinkNode?: LinkNode

  @property({type: String})
  fsSpecPath!: string

  @state()
  currentIndex = 0

  @state()
  isSlideshow = false

  panzoom: PanzoomObject | undefined
  intervalId?: number

  private pathLoaderTask = new Task(this, {
    task: async ([src], {signal}) => {
      try {
        return loadFolderNode(src, signal).then((data) => {
          if (this.fileLinkNode) {
            this.currentIndex = data.fileLinks.map(path => path.physicalPath).indexOf(this.fileLinkNode.physicalPath)
          }

          return data
        })
      } catch (ex: unknown) {
        alertDialog(this, 'Error', ex instanceof Error ? ex.message : String(ex))
        return {path: src, fileLinks: [], folderLinks: []} as FolderNode
      }
    },
    args: () => [this.fsSpecPath]
  })

  connectedCallback() {
    super.connectedCallback()
    this.tabIndex = 0
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this.panzoom?.destroy()
    this.pause()
  }

  firstUpdated() {
    window.addEventListener('keyup', this.handleKeyUp.bind(this))
  }

  updated() {
    if (this.pathLoaderTask.status === TaskStatus.COMPLETE && !this.isSlideshow && !this.panzoom) {
      this.setPanzoom()
    }
  }

  getMinimumDimensions() {
    return {width: 256, height: 256}
  }

  setPanzoom() {
    this.panzoom = Panzoom(this.image, {
      canvas: true,
      contain: 'outside',
    })
  }

  exitSlideshow() {
    window.removeEventListener('keyup', this.handleKeyUp.bind(this))
    this.isSlideshow = false
    this.dispatchEvent(windowPropertyChangeEvent({state: WindowState.Default}))
    this.pause()
  }

  handleKeyUp(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.exitSlideshow()
    }
  }

  handleSlideshowClick() {
    if (this.pathLoaderTask.status === TaskStatus.COMPLETE) {
      this.isSlideshow = true
      this.dispatchEvent(windowPropertyChangeEvent({state: WindowState.Fullscreen}))
      this.panzoom?.destroy()
      this.play()
    }
  }

  goToPrevious() {
    if (this.pathLoaderTask.status === TaskStatus.COMPLETE) {
      this.currentIndex--

      if (this.currentIndex < 0) {
        this.currentIndex = this.pathLoaderTask.value!.fileLinks.length - 1
      }
    }
  }

  goToNext() {
    if (this.pathLoaderTask.status === TaskStatus.COMPLETE) {
      this.currentIndex++

      if (this.currentIndex >= this.pathLoaderTask.value!.fileLinks.length) {
        this.currentIndex = 0
      }
    }
  }

  play() {
    this.intervalId = setInterval(() => this.goToNext(), 5000)
  }

  pause() {
    clearInterval(this.intervalId)
  }

  handlePlayClick() {
    this.playButton.classList.add('active')
    this.pauseButton.classList.remove('active')
    this.play()
  }

  handlePauseClick() {
    this.pauseButton.classList.add('active')
    this.playButton.classList.remove('active')
    this.pause()
  }

  render() {
    return this.pathLoaderTask.render({
      pending: () => html`
        <div class="app">
          <div class="content"></div>
        </div>`,
      complete: (folderNode: FolderNode) => {
        const wrapperStyle = {backgroundImage: `url('${folderNode.fileLinks[this.currentIndex].physicalPath}')`}

        if (this.isSlideshow) {
          return html`
            <div class="app">
              <div class="content">
                <div id="image" class="slideshow" style="${styleMap(wrapperStyle)}" @click="${this.goToNext}"></div>
                <div class="slideshow-controls buttons">
                  <button class="active tool-button" id="play" @click="${this.handlePlayClick}">
                    <img src="/img/image-viewer/play.png"/>
                  </button>
                  <button class="tool-button" id="pause" @click="${this.handlePauseClick}">
                    <img src="/img/image-viewer/pause.png"/>
                  </button>
                  <div class="divider"></div>
                  <button class="tool-button" @click="${this.goToPrevious}">
                    <img src="/img/image-viewer/previous.png"/>
                  </button>
                  <button class="tool-button" @click="${this.goToNext}">
                    <img src="/img/image-viewer/next.png"/>
                  </button>
                  <div class="divider"></div>
                  <button class="tool-button" @click="${this.exitSlideshow}">
                    <img src="/img/image-viewer/exit.png"/>
                  </button>
                </div>
              </div>
            </div>`
        } else {
          return html`
            <div class="app">
              <div class="content">
                <div class="viewport">
                  <div class="image-wrapper"
                       @wheel="${(event: WheelEvent) => this.panzoom?.zoomWithWheel(event)}">
                    <div id="image" style="${styleMap(wrapperStyle)}"></div>
                  </div>
                  <div class="buttons">
                    <button class="tool-button" @click="${this.goToPrevious}">
                      <img src="/img/image-viewer/previous.png"/>
                    </button>
                    <button class="tool-button" @click="${this.goToNext}">
                      <img src="/img/image-viewer/next.png"/>
                    </button>
                    <div class="divider"></div>
                    <button class="tool-button" @click="${() => this.panzoom?.zoom(1)}">
                      <img src="/img/image-viewer/best-fit.png"/>
                    </button>
                    <button class="tool-button" @click="${() => this.panzoom?.zoom(4)}">
                      <img src="/img/image-viewer/actual-size.png"/>
                    </button>
                    <button class="tool-button" @click="${this.handleSlideshowClick}">
                      <img src="/img/image-viewer/slideshow.png"/>
                    </button>
                    <div class="divider"></div>
                    <button class="tool-button" @click="${() => this.panzoom?.zoomIn()}">
                      <img src="/img/image-viewer/zoom-in.png"/>
                    </button>
                    <button class="tool-button" @click="${() => this.panzoom?.zoomOut()}">
                      <img src="/img/image-viewer/zoom-out.png"/>
                    </button>
                    <div class="divider"></div>
                    <button class="tool-button" @click="${() => window.print()}">
                      <img src="/img/image-viewer/print.png"/>
                    </button>
                  </div>
                </div>
              </div>
            </div>`
        }
      }
    })
  }
}