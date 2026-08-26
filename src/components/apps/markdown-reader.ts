import {EpkApp} from "../app.ts";
import {customElement, property} from "lit/decorators.js";
import {css, html, LitElement, unsafeCSS} from "lit";
import xpStyle from "xp.css/dist/XP.css?inline";
import {Task} from "@lit/task";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {marked} from "marked";

@customElement('markdown-viewer')
export class MarkdownViewer extends LitElement {
  static styles = [
    unsafeCSS(xpStyle),
    css`
      .container {
        border: none;
        height: 100%;
        width: 100%;
      }

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
        <div class="markdown"></div>`,
      complete: (documentBody) => html`
        <div class="markdown">
          ${unsafeHTML(marked.parse(documentBody) as string)}
        </div>`,
      error: () => html`
        <div class="markdown">Error</div>`
    })
  }
}

@customElement('markdown-reader')
export class MarkdownReader extends EpkApp {
  windowIcon = '/img/1489.ico'
  windowTitle = 'ICOT? Document Reader'

  srcDocument: string = ''
  markdownViewer: MarkdownViewer | undefined

  constructor(srcDocument: string) {
    super()
    this.srcDocument = srcDocument
  }

  connectedCallback() {
    super.connectedCallback()

    this.markdownViewer = new MarkdownViewer()
    this.markdownViewer.srcDocument = this.srcDocument
  }

  getToolbar() {
    return null
  }

  getWindowContents(): LitElement {
    return this.markdownViewer!
  }

  getStatusBar() {
    return null
  }
}