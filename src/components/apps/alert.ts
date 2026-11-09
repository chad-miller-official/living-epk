import {customElement, property, query} from "lit/decorators.js"
import {EpkApp} from "../app.ts"
import {css, html, nothing} from "lit";
import {closeWindowEvent} from "../../lib/events.ts";

@customElement('epk-alert')
export class EpkAlert extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    css`
      .alert {
        align-items: flex-start;
        display: flex;
        flex-direction: row;
        padding: 12px;
        gap: 16px;
      }

      .container {
        align-items: center;
        display: flex;
        flex-direction: column;
        font-family: "Pixelated MS Sans Serif", Arial;
        gap: 16px;
        overflow-wrap: anywhere;
      }

      .left {
        margin-right: auto;
      }

      .message {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .right {
        margin-left: auto;
      }
    `
  ]

  @query('#silencer')
  silencer?: HTMLInputElement

  @property({type: String})
  alertGraphic: string = '/img/error.png'

  @property({type: String})
  buttonPosition?: 'left' | 'right'

  @property({type: String})
  message!: string

  @property({type: String})
  silenceId?: string

  @property({type: String})
  windowTitle = 'Error'

  windowIcon = null
  doNotTrackLastPosition = true

  getMinimumDimensions(): [number, null] {
    return [356, null]
  }

  async handleOkClick() {

    if (this.silenceId && this.silencer?.checked) {
      await cookieStore.set(this.silenceId, 'true')
    }

    this.dispatchEvent(closeWindowEvent())
  }

  render() {
    return html`
      <div class="app">
        <div class="content">
          <div class="alert">
            <img src="${this.alertGraphic}" width="32" height="32"/>
            <div class="container">
              <div class="message">
                ${this.message}
                ${this.silenceId ? html`
                  <div>
                    <input type="checkbox" id="silencer"/>
                    <label for="silencer">In the future, do not show this warning</label>
                  </div>
                ` : nothing}
              </div>
              <button type="submit" class="${this.buttonPosition}"
                      @click="${this.handleOkClick}">
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    `
  }
}