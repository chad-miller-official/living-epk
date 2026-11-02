import {customElement, property} from "lit/decorators.js";
import {css, html} from "lit";
import {Task} from "@lit/task";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {EpkApp} from "../app.ts";
import {alertDialog} from "../../lib/os.ts";

@customElement('document-reader')
export class DocumentReader extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    css`
      .container {
        box-sizing: border-box;
        font-family: 'Tahoma';
        font-size: medium;
        height: 100%;
        overflow-y: scroll;
        
        & > * {
          background-repeat: repeat;
          box-sizing: border-box;
          height: fit-content;
          min-height: 100%;
        }

        h1, h2, h3, h4, h5, h6 {
          font-size: revert;
        }
      }
    `
  ]

  @property({type: String})
  windowTitle = 'Document Viewer'

  @property({type: String})
  windowIcon = '/img/document-reader.ico'

  @property({type: String})
  srcDocument: string = ''

  private documentTask = new Task(this, {
    task: async ([src], {signal}) => {
      const response = await fetch(src, {signal})

      if (!response.ok) {
        alertDialog(this, 'Error', `Failed to load '${src}': ${response.statusText}`)
        return ''
      }

      return await response.text()
    },
    args: () => [this.srcDocument]
  })



  render() {
    return this.documentTask.render({
      pending: () => html`
        <div class="app">
          <div class="content">
            Loading...
          </div>
        </div>`,
      complete: (documentBody) => html`
        <div class="app">
          <div class="content">
            <div class="container">
              ${unsafeHTML(documentBody as string)}
            </div>
          </div>
        </div>`,
      error: () => html`
        <div class="app">
          <div class="content">Error</div>
        </div>`
    })
  }
}