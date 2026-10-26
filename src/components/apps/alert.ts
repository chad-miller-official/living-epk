import {customElement, property} from "lit/decorators.js"
import {EpkApp} from "../app.ts"
import {css, html} from "lit";
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

      .message {
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 16px;
        overflow-wrap: anywhere;
      }
    `
  ]

  @property({type: String})
  alertGraphic: string = '/img/error.png'

  @property({type: String})
  message!: string

  @property({type: String})
  windowTitle = 'Error'

  @property({type: Boolean})
  playSound = true

  windowIcon = null
  doNotTrackLastPosition = true

  getMinimumDimensions(): [number | null, number | null] {
    return [356, null]
  }

  render() {
    if (this.playSound) {
      new Audio('/audio/error.wav').play()
    }

    return html`
      <div class="app">
        <div class="content">
          <div class="alert">
            <img src="${this.alertGraphic}" width="32" height="32"/>
            <div class="message">
              <div>${this.message}</div>
              <button type="button" @click="${() => this.dispatchEvent(closeWindowEvent())}">
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    `
  }
}