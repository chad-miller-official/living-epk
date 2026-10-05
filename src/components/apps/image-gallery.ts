import {css, html} from "lit";
import {EpkApp} from "../app.ts";
import {customElement, property, query, state} from "lit/decorators.js";
import {type FsSpec, loadFsSpec} from "../../lib/fs.ts";
import {Task, TaskStatus} from "@lit/task";
import Panzoom, {type PanzoomObject} from "@panzoom/panzoom";
import {styleMap} from "lit/directives/style-map.js";
import {launchEvent} from "../../lib/events.ts";

let imageGalleryFullscreen: ImageGalleryFullscreen | undefined

@customElement('image-gallery')
export class ImageGallery extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    css`
      .buttons {
        display: flex;
        justify-content: center;
        gap: 5px;
        margin: 8px 8px;

        button {
          align-items: center;
          background: transparent;
          border: 1px solid transparent;
          display: flex;
          justify-content: center;
          min-height: 0;
          min-width: 0;
          padding: 1px 4px;

          &:focus {
            outline: none;
          }

          &:hover {
            box-shadow: inset 0 -6px 6px -7px rgba(0, 0, 0, 0.4);
            border: 1px solid #cecec3;
          }

          * {
            user-select: none;
          }
        }
      }

      .divider {
        background-color: #ccc8b6;
        height: 16px;
        margin: 2px;
        width: 1px;
      }

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
  filePath: string | undefined

  @property({type: String})
  fsSpecPath!: string

  @state()
  currentIndex = 0

  private panzoom: PanzoomObject | undefined

  private pathLoaderTask = new Task(this, {
    task: async ([src], {signal}) => {
      try {
        return loadFsSpec(src, signal).then((data) => {
          if (this.filePath) {
            this.currentIndex = data.paths.map(path => path.path).indexOf(this.filePath)
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

  updated() {
    if (this.pathLoaderTask.status === TaskStatus.COMPLETE) {
      this.panzoom = Panzoom(this.image, {
        canvas: true,
        contain: 'outside',
      })
    }
  }

  handleSlideshowClick() {
    if (this.pathLoaderTask.status === TaskStatus.COMPLETE) {
      const goToNext = this.goToNext.bind(this)

      this.dispatchEvent(launchEvent(() => new Promise<ImageGalleryFullscreen>(resolve => {
        const fullscreen = new ImageGalleryFullscreen()
        fullscreen.backgroundImageUrl = this.pathLoaderTask.value!.paths[this.currentIndex].path
        fullscreen.addEventListener('click', goToNext)
        return resolve(fullscreen)
      }), {
        fullscreen: true
      }))
    }
  }

  setFullscreenBackgroundImageUrl() {
    if (imageGalleryFullscreen) {
      imageGalleryFullscreen.backgroundImageUrl = this.pathLoaderTask.value!.paths[this.currentIndex].path
    }
  }

  goToPrevious() {
    if (this.pathLoaderTask.status === TaskStatus.COMPLETE) {
      this.currentIndex--

      if (this.currentIndex < 0) {
        this.currentIndex = this.pathLoaderTask.value!.paths.length - 1
      }
    }

    this.setFullscreenBackgroundImageUrl()
  }

  goToNext() {
    if (this.pathLoaderTask.status === TaskStatus.COMPLETE) {
      this.currentIndex++

      if (this.currentIndex >= this.pathLoaderTask.value!.paths.length) {
        this.currentIndex = 0
      }
    }

    this.setFullscreenBackgroundImageUrl()
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
                  <button @click="${this.goToPrevious}">
                    <img src="/img/image-viewer/previous.png"/>
                  </button>
                  <button @click="${this.goToNext}">
                    <img src="/img/image-viewer/next.png"/>
                  </button>
                  <div class="divider"></div>
                  <button @click="${() => this.panzoom?.zoom(1)}">
                    <img src="/img/image-viewer/best-fit.png"/>
                  </button>
                  <button @click="${() => this.panzoom?.zoom(4)}">
                    <img src="/img/image-viewer/actual-size.png"/>
                  </button>
                  <button @click="${this.handleSlideshowClick}">
                    <img src="/img/image-viewer/slideshow.png"/>
                  </button>
                  <div class="divider"></div>
                  <button @click="${() => this.panzoom?.zoomIn()}">
                    <img src="/img/image-viewer/zoom-in.png"/>
                  </button>
                  <button @click="${() => this.panzoom?.zoomOut()}">
                    <img src="/img/image-viewer/zoom-out.png"/>
                  </button>
                  <div class="divider"></div>
                  <button @click="${() => window.print()}">
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
    css`
      #image {
        background-position: center;
        background-repeat: no-repeat;
        background-size: contain;
        width: 100%;
        height: 100%;
      }
    `
  ]

  @property({type: String})
  backgroundImageUrl!: string

  windowTitle = 'Image Gallery'
  windowIcon = null

  connectedCallback() {
    super.connectedCallback()
    imageGalleryFullscreen = this
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    imageGalleryFullscreen = undefined
  }

  render() {
    const wrapperStyle = {backgroundImage: `url('${this.backgroundImageUrl}')`}

    return html`
      <div id="image" style="${styleMap(wrapperStyle)}"></div>`
  }
}