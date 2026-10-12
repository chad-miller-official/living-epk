import {customElement, property} from "lit/decorators.js";
import {EpkApp} from "../app.ts";
import {css, html} from "lit";
import {closeWindowEvent, launchEvent} from "../../lib/events.ts";
import {Notepad} from "./notepad.ts";
import {unsafeHTML} from "lit/directives/unsafe-html.js";

@customElement('app-about')
export class AppAbout extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    css`
      .about {
        display: flex;
        flex-direction: column;
        font-family: "Pixelated MS Sans Serif", Arial;
        height: 100%;
      }

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

        .upper {
          height: 70%;
        }

        .lower {
          align-items: flex-start;
          height: 30%;
        }

        .upper, .lower {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        p {
          margin: 0 0 6px 0;
        }
      }

      .eula {
        color: #082ea2;
        cursor: pointer;
        text-decoration: underline;
      }

      .eula-user {
        margin: 10px 0 18px 14px;
      }

      .memory {
        width: 100%;
      }

      button {
        align-self: flex-end;
      }

      hr {
        width: 100%;
      }
    `
  ]

  @property({type: String})
  appIcon!: string

  @property({type: String})
  appName!: string

  @property({type: String})
  windowTitle = 'About'

  windowIcon = null

  handleEulaClick(event: Event) {
    event.stopPropagation()

    this.dispatchEvent(launchEvent(() => new Promise<Notepad>(resolve => {
      const notepad = new Notepad()
      notepad.windowTitle = `Notepad - eula`
      notepad.filePath = '/fs/plaintext/eula.txt'
      resolve(notepad)
    })))
  }

  requestClose() {
    this.dispatchEvent(closeWindowEvent())
  }

  render() {
    return html`
      <div class="app">
        <div class="content">
          <div class="about">
            <img src="/img/banner.png" width="413" alt="Banner"/>
            <div class="about-wrapper">
              <img src="${this.appIcon}" alt="${this.appName}"/>
              <div class="about-text">
                <div class="upper">
                  <div>
                    <p>${unsafeHTML(this.appName)}</p>
                    <p>Version 5.1 (Build 2600.xpsp.080413-2111 : Service Pack 3)</p>
                    <p>Copyright &copy; 2007 Microsoft Corporation</p>
                  </div>
                  <div>
                    <p>
                      This product is licensed under the terms of the
                      <span class="eula"
                            @click="${this.handleEulaClick}">End-User License Agreement</span>
                      to:
                    </p>
                    <p class="eula-user">chad</p>
                  </div>
                </div>
                <div class="lower">
                  <div class="memory">
                    <hr/>
                    <div>
                      Physical memory available to Windows:
                      <span class="memory">196,080 KB</span>
                    </div>
                  </div>
                  <button @click="${this.requestClose}">OK</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`
  }
}