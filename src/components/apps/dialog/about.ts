import {customElement, property} from "lit/decorators.js";
import {EpkApp} from "../../app.ts";
import {css, html} from "lit";
import {launchEvent} from "../../../lib/events.ts";
import {Notepad} from "../notepad.ts";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {LinkNodeType} from "../../../lib/fs.ts";
import {Dialog} from "./dialog.ts";
import type { Dimensions } from "../../window.ts";

@customElement('app-about')
export class AppAbout extends Dialog(EpkApp) {
  static styles = [
    ...EpkApp.styles,
    css`
      .about-text {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .about-wrapper {
        align-items: flex-start;
        display: flex;
        gap: 8px;
        height: 100%;
        padding: 14px;
      }
      
      .app-icon {
        height: 48px;
        width: 48px;
      }

      .close-button {
        align-self: flex-end;
      }

      .content {
        display: flex;
        flex-direction: column;
        font-family: "Pixelated MS Sans Serif", Arial;
        height: 100%;
      }

      .eula {
        color: #082ea2;
        cursor: pointer;
        text-decoration: underline;
      }

      .legal-text {
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        &.lower {
          align-items: flex-start;
          height: 30%;
        }

        &.upper {
          height: 70%;
        }
      }

      .memory {
        width: 100%;
      }

      hr {
        width: 100%;
      }
      
      img {
        user-select: none;
      }

      p {
        margin: 0 0 6px 0;

        &.eula-user {
          margin: 10px 0 18px 14px;
        }
      }`
  ]

  @property({type: String})
  appIcon?: string

  @property({type: String})
  appName!: string

  @property({type: String})
  windowIcon = null

  @property({type: String})
  windowTitle = 'About'

  getMinimumDimensions(): Partial<Dimensions> {
    return {width: 419, height: 350}
  }

  handleEulaClick(event: Event) {
    event.stopPropagation()

    this.dispatchEvent(launchEvent(() => {
      const notepad = new Notepad()
      notepad.windowTitle = `Notepad - eula`

      notepad.fileLinkNode = {
        type: LinkNodeType.File,
        physicalPath: '/fs/plaintext/eula.txt',
        logicalPath: 'C:\\Windows\\eula.txt'
      }

      return notepad
    }))
  }

  render() {
    return html`
      <div class="app">
        <div class="content">
          <img src="/img/about/banner.png" width="413" alt="Banner"/>
          <div class="about-wrapper">
            ${this.appIcon ? html`<img src="${this.appIcon}" class="app-icon" alt="${this.appName}" width="48"
                                       height="48"/>` : html`
              <div class="app-icon"></div>`}
            <div class="about-text">
              <div class="legal-text upper">
                <div>
                  <p>${unsafeHTML(this.appName)}</p>
                  <p>Version 5.1 (Build 2600.xpsp.080413-2111 : Service Pack 3)</p>
                  <p>Copyright &copy; 2007 Microsoft Corporation</p>
                </div>
                <div>
                  <p>
                    This product is licensed under the terms of the
                    <span class="eula" @click="${this.handleEulaClick}">
                        End-User License Agreement
                      </span>
                    to:
                  </p>
                  <p class="eula-user">chad</p>
                </div>
              </div>
              <div class="legal-text lower">
                <div class="memory">
                  <hr/>
                  Physical memory available to Windows: 196,080 KB
                </div>
                <button type="button" class="close-button" @click="${this.close}">OK</button>
              </div>
            </div>
          </div>
        </div>
      </div>`
  }
}