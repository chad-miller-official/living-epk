import {css, html, LitElement, unsafeCSS} from "lit"
import xpStyle from 'xp.css/dist/XP.css?inline'
import {EpkStatusBar, type EpkToolbar} from "./ui.ts";
import {query, queryAll} from "lit/decorators.js";

export abstract class EpkApp extends LitElement {
  static styles = [
    unsafeCSS(xpStyle),
    css`
      #content {
        flex-grow: 1;
      }

      #content, #toolbar {
        margin: 0 auto;
        width: calc(100% - 6px);
      }
      
      .app {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
    `
  ]

  @query('#toolbar > .epk-toolbar')
  toolbar: EpkToolbar | undefined

  @query('#statusBar > .epk-status-bar')
  statusBar: EpkStatusBar | undefined

  @queryAll('#content > *')
  content: HTMLElement[] | undefined

  abstract windowTitle: string
  abstract windowIcon: string

  abstract getToolbar(): EpkToolbar | null

  abstract getWindowContents(): LitElement

  abstract getStatusBar(): EpkStatusBar | null

  /**
   * Returns a tuple in the form of [width, height], both in pixels.
   */
  getMinimumDimensions(): [number | null, number | null] {
    return [256, 256]
  }

  handleClick(event: Event) {
    const toolbar = this.getToolbar()

    if (event.target !== toolbar) {
      toolbar?.closeAll()
    }
  }

  render() {
    const toolbar = this.getToolbar()
    toolbar?.classList.add('epk-toolbar')

    const statusBar = this.getStatusBar()
    statusBar?.classList.add('epk-status-bar')

    return html`
      <div class="app" @click="${this.handleClick}">
        ${toolbar == null ? '' : html`
          <div id="toolbar">
            ${this.getToolbar()}
          </div>`}
        <div id="content">
          ${this.getWindowContents()}
        </div>
        ${statusBar == null ? '' : html`
          <div id="statusBar">
            ${statusBar}
          </div>`}
      </div>
    `
  }
}