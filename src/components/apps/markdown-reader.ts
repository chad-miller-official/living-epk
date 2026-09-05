import {customElement, property} from "lit/decorators.js";
import {css, html} from "lit";
import {Task} from "@lit/task";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {marked} from "marked";
import {EpkApp} from "../app.ts";

@customElement('markdown-reader')
export class MarkdownReader extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    css`
      .markdown {
        height: 100%;
        overflow-y: scroll;
      }
    `
  ]

  @property({type: String})
  windowTitle = 'Document Viewer'

  @property({type: String})
  windowIcon = '/img/1483.ico'

  @property({type: String})
  srcDocument: string = ''

  private documentTask = new Task(this, {
    task: async ([src], {signal}) => {
      const response = await fetch(src, {signal})

      if (!response.ok) {
        alert('Error') // TODO XXX FIXME
      }

      return await response.text()
    },
    args: () => [this.srcDocument]
  })

  render() {
    return this.documentTask.render({
      pending: () => html`
        <div class="app content"></div>`,
      complete: (documentBody) => html`
        <div class="app">
          <div class="content">
            <div class="markdown">
              ${unsafeHTML(marked.parse(documentBody) as string)}
            </div>
          </div>
        </div>`,
      error: () => html`
        <div class="app content">Error</div>`
    })
  }
}