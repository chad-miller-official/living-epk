import {css, html} from "lit";
import {EpkApp} from "../app.ts";
import {customElement, property, state} from "lit/decorators.js";
import {type FsSpec, loadFsSpec} from "../../lib/fs.ts";
import {Task} from "@lit/task";
import {styleMap} from "lit/directives/style-map.js";

@customElement('image-gallery')
export class ImageGallery extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    css`
      .image {
        background-repeat: no-repeat;
        background-size: contain;
        width: 100%;
        height: 100%;
      }
    `
  ]

  @property({type: String})
  windowTitle = 'Image Gallery'

  @property({type: String})
  windowIcon = '/img/gallery-small.ico'

  @property({type: String})
  fsSpecPath!: string

  @state()
  currentIndex = 0

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
              <div class="image" style="${styleMap(wrapperStyle)}"></div>
            </div>
          </div>`
      }
    })
  }
}