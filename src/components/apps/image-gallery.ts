import {css, html} from "lit";
import {EpkApp} from "../app.ts";
import {customElement, property, query, state} from "lit/decorators.js";
import {type FsSpec, loadFsSpec} from "../../lib/fs.ts";
import {Task, TaskStatus} from "@lit/task";
import Panzoom, {type PanzoomObject} from "@panzoom/panzoom";
import {styleMap} from "lit/directives/style-map.js";

@customElement('image-gallery')
class ImageGallery extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    css`
      .buttons {
        display: flex;
        justify-content: center;
        gap: 5px;
        margin: 8px 0;

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
  fsSpecPath!: string

  @state()
  currentIndex = 0

  private panzoom: PanzoomObject | undefined

  private pathLoaderTask = new Task(this, {
    task: async ([src], {signal}) => {
      try {
        return loadFsSpec(src, signal)
      } catch (ex: unknown) {
        // TODO this should bring up a Windows XP-style alert
        alert(ex instanceof Error ? ex.message : String(ex))
        return {} as FsSpec
      }
    },
    args: () => [this.fsSpecPath]
  })

  updated() {
    if (this.pathLoaderTask.status === TaskStatus.COMPLETE) {
      this.panzoom = Panzoom(this.image, {
        canvas: true,
        contain: 'outside',
      })
    }
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
                  <button><img src="/img/image-viewer/previous.png"/></button>
                  <button><img src="/img/image-viewer/next.png"/></button>
                  <div class="divider"></div>
                  <button><img src="/img/image-viewer/best-fit.png"/></button>
                  <button><img src="/img/image-viewer/actual-size.png"/></button>
                  <button><img src="/img/image-viewer/slideshow.png"/></button>
                  <div class="divider"></div>
                  <button><img src="/img/image-viewer/zoom-in.png"/></button>
                  <button><img src="/img/image-viewer/zoom-out.png"/></button>
                  <div class="divider"></div>
                  <button><img src="/img/image-viewer/print.png"/></button>
                </div>
              </div>
            </div>
          </div>`
      }
    })
  }
}

export default ImageGallery