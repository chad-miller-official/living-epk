import {customElement, property} from "lit/decorators.js";
import {css, html, LitElement} from "lit";
import {Task} from "@lit/task";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {marked} from "marked";
import {appStyles} from "../ui.ts";

@customElement('markdown-reader')
export class MarkdownReader extends LitElement {
  static styles = [
    ...appStyles,
    css`
      .markdown {
        height: calc(100% - 16px);
        overflow-y: scroll;
        padding: 8px;

        & > :first-child {
          margin-top: 0;
        }
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
        <div class="app markdown"></div>`,
      complete: (documentBody) => html`
        <div class="content">
          <div class="app markdown">
            ${unsafeHTML(marked.parse(documentBody) as string)}
          </div>
        </div>`,
      error: () => html`
        <div class="app markdown">Error</div>`
    })
  }
}