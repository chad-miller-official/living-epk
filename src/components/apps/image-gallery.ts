import {css, html} from "lit";
import {EpkApp} from "../app.ts";
import {customElement, property, query, state} from "lit/decorators.js";
import {type FsPath, type FsSpec, loadFsSpec} from "../../lib/fs.ts";
import {Task, TaskStatus} from "@lit/task";
import Panzoom, {type PanzoomObject} from "@panzoom/panzoom";
import {styleMap} from "lit/directives/style-map.js";
import {closeWindowEvent, launchEvent} from "../../lib/events.ts";
import {buttonStyle2} from "../ui.ts";

const buttonStyle = css`
  .buttons {
    background-color: #eef2fb;
    display: flex;
    justify-content: center;
    gap: 5px;
    margin: 8px 8px;
  }

  .divider {
    background-color: #ccc8b6;
    height: 16px;
    margin: 2px;
    width: 1px;
  }
`

@customElement('image-gallery')
export class ImageGallery extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    buttonStyle,
    buttonStyle2,
    css`
      .image-wrapper {
        height: 100%;
        width: 100%;
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

  @property({type: String})
  windowTitle = 'Windows Picture and Fax Viewer'

  @property({type: String})
  windowIcon = '/img/gallery-small.ico'

  @property({type: String})
  filePath?: FsPath

  @property({type: String})
  fsSpecPath!: string

  @state()
  currentIndex = 0

  panzoom: PanzoomObject | undefined
  fullscreen: ImageGalleryFullscreen | undefined

  private pathLoaderTask = new Task(this, {
    task: async ([src], {signal}) => {
      try {
        return loadFsSpec(src, signal).then((data) => {
          if (this.filePath) {
            this.currentIndex = data.paths.map(path => path.path).indexOf(this.filePath.path)
          }

          return data
        })
      } catch (ex: unknown) {
        // TODO this should bring up a Windows XP-style alert
        alert(ex instanceof Error ? ex.message : String(ex))
        return {} as FsSpec
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

    if (this.fullscreen) {
      this.fullscreen.dispatchEvent(closeWindowEvent())
    }
  }

  updated() {
    if (this.pathLoaderTask.status === TaskStatus.COMPLETE) {
      this.panzoom = Panzoom(this.image, {
        canvas: true,
        contain: 'outside',
      })
    }
  }

  getCurrentImage() {
    return this.pathLoaderTask.value!.paths[this.currentIndex].path
  }

  handleSlideshowClick() {
    if (this.pathLoaderTask.status === TaskStatus.COMPLETE) {
      const thisRef = this

      this.dispatchEvent(launchEvent(() => new Promise<ImageGalleryFullscreen>(resolve => {
        this.fullscreen = new ImageGalleryFullscreen()
        this.fullscreen.associatedWindow = thisRef
        return resolve(this.fullscreen)
      }), {
        fullscreen: true
      }))
    }
  }

  goToPrevious() {
    if (this.pathLoaderTask.status === TaskStatus.COMPLETE) {
      this.currentIndex--

      if (this.currentIndex < 0) {
        this.currentIndex = this.pathLoaderTask.value!.paths.length - 1
      }
    }

    this.fullscreen?.requestUpdate()
  }

  goToNext() {
    if (this.pathLoaderTask.status === TaskStatus.COMPLETE) {
      this.currentIndex++

      if (this.currentIndex >= this.pathLoaderTask.value!.paths.length) {
        this.currentIndex = 0
      }
    }

    this.fullscreen?.requestUpdate()
  }

  render() {
    return this.pathLoaderTask.render({
      pending: () => html`
        <div class="app">
          <div class="content"></div>
        </div>`,
      complete: (spec: FsSpec) => {
        const wrapperStyle = {backgroundImage: `url('${spec.paths[this.currentIndex].path}')`}

        return html`
          <div class="app">
            <div class="content">
              <div class="viewport">
                <div class="image-wrapper"
                     @wheel="${(event: WheelEvent) => this.panzoom?.zoomWithWheel(event)}">
                  <div id="image" style="${styleMap(wrapperStyle)}"></div>
                </div>
                <div class="buttons">
                  <button class="style-2" @click="${this.goToPrevious}">
                    <img src="/img/image-viewer/previous.png"/>
                  </button>
                  <button class="style-2" @click="${this.goToNext}">
                    <img src="/img/image-viewer/next.png"/>
                  </button>
                  <div class="divider"></div>
                  <button class="style-2" @click="${() => this.panzoom?.zoom(1)}">
                    <img src="/img/image-viewer/best-fit.png"/>
                  </button>
                  <button class="style-2" @click="${() => this.panzoom?.zoom(4)}">
                    <img src="/img/image-viewer/actual-size.png"/>
                  </button>
                  <button class="style-2" @click="${this.handleSlideshowClick}">
                    <img src="/img/image-viewer/slideshow.png"/>
                  </button>
                  <div class="divider"></div>
                  <button class="style-2" @click="${() => this.panzoom?.zoomIn()}">
                    <img src="/img/image-viewer/zoom-in.png"/>
                  </button>
                  <button class="style-2" @click="${() => this.panzoom?.zoomOut()}">
                    <img src="/img/image-viewer/zoom-out.png"/>
                  </button>
                  <div class="divider"></div>
                  <button class="style-2" @click="${() => window.print()}">
                    <img src="/img/image-viewer/print.png"/>
                  </button>
                </div>
              </div>
            </div>
          </div>`
      }
    })
  }
}

@customElement('image-gallery-fullscreen')
export class ImageGalleryFullscreen extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    buttonStyle,
    buttonStyle2,
    css`
      #image {
        background-color: black;
        background-position: center;
        background-repeat: no-repeat;
        background-size: contain;
        height: 100vh;
        left: 0;
        position: absolute;
        top: 0;
        width: 100vw;
        z-index: 10000;
      }

      .buttons {
        gap: 2px;
        margin: 0;
      }

      .controls {
        opacity: 0;
        position: absolute;
        right: 0;
        top: 0;
        z-index: 10001;

        &:hover {
          opacity: 100%;
        }
      }
    `
  ]

  @query('#play')
  playButton!: HTMLButtonElement

  @query('#pause')
  pauseButton!: HTMLButtonElement

  windowTitle = 'Image Gallery'
  windowIcon = null

  associatedWindow: ImageGallery | undefined
  intervalId = this.play()

  firstUpdated() {
    this.addEventListener('close-window', this.handleCloseWindow)
    window.addEventListener('keyup', this.handleKeyUp.bind(this))
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this.pause()
  }

  play() {
    return setInterval(() => {
      this.associatedWindow?.goToNext()
    }, 5000)
  }

  pause() {
    clearInterval(this.intervalId)
  }

  handleCloseWindow() {
    if (this.associatedWindow) {
      this.associatedWindow.fullscreen = undefined
    }

    this.remove()
  }

  handleKeyUp(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.close()
    }
  }

  handleClick() {
    this.associatedWindow?.goToNext()
    this.handlePauseClick()
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

  handleCloseClick(event: PointerEvent) {
    event.stopPropagation()
    this.close()
  }

  close() {
    this.dispatchEvent(closeWindowEvent())
    window.removeEventListener('keyup', this.handleKeyUp.bind(this))
  }

  render() {
    const associatedWindow = this.associatedWindow
    const wrapperStyle = {backgroundImage: `url('${associatedWindow?.getCurrentImage()}')`}

    return html`
      <div id="image" style="${styleMap(wrapperStyle)}"
           @click="${this.handleClick}"></div>
      <div class="controls buttons">
        <button class="active style-2" id="play" @click="${this.handlePlayClick}">
          <img src="/img/image-viewer/play.png"/>
        </button>
        <button class="style-2" id="pause" @click="${this.handlePauseClick}">
          <img src="/img/image-viewer/pause.png"/>
        </button>
        <div class="divider"></div>
        <button class="style-2" @click="${associatedWindow?.goToPrevious.bind(associatedWindow)}">
          <img src="/img/image-viewer/previous.png"/>
        </button>
        <button class="style-2" @click="${associatedWindow?.goToNext.bind(associatedWindow)}">
          <img src="/img/image-viewer/next.png"/>
        </button>
        <div class="divider"></div>
        <button class="style-2" @click="${this.handleCloseClick}">
          <img src="/img/image-viewer/exit.png"/>
        </button>
      </div>`
  }
}