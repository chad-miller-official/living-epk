import {EpkApp} from "./base.ts";
import {customElement, property} from "lit/decorators.js";
import {css, html, LitElement, unsafeCSS} from "lit";
import xpStyle from "xp.css/dist/XP.css?inline";

@customElement('html-renderer')
export class HtmlRenderer extends LitElement {
  static styles = [
    unsafeCSS(xpStyle),
    css`
      .web-browser {
        background-color: #ffffff;
        border: none;
        height: 100%;
        width: 100%;
      }
    `
  ]
  @property({type: String})
  srcDocument: string = ''

  render() {
    return html`
      <iframe class="web-browser" src="${this.srcDocument}" title="${this.srcDocument}"></iframe>
    `
  }
}

@customElement('web-browser')
export class WebBrowser extends EpkApp {
  windowIcon = '/img/1489.ico'
  windowTitle = 'ICOT? HTML Viewer'

  srcDocument: string = ''
  htmlRenderer: HtmlRenderer | undefined

  constructor(srcDocument: string) {
    super()
    this.srcDocument = srcDocument
  }

  connectedCallback() {
    super.connectedCallback()

    this.htmlRenderer = new HtmlRenderer()
    this.htmlRenderer.srcDocument = this.srcDocument
  }

  getToolbar() {
    return null
  }

  getWindowContents(): LitElement {
    return this.htmlRenderer!
  }

  getStatusBar() {
    return null
  }
}