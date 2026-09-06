import {getFileExtension} from "../../lib/fs.ts";
import {customElement, property, state} from "lit/decorators.js";
import {css, html} from "lit";
import {EpkApp} from "../app.ts";

@customElement('audio-player')
export class AudioPlayer extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    css`
      audio {
        width: 100%;
      }
    `
  ]

  @property({type: String})
  windowTitle = 'Windows Media Player'

  @property({type: String})
  windowIcon = '/img/audio-player-small.ico'

  @property({type: String})
  filePath: string | undefined

  @state()
  mimeType: string | undefined

  connectedCallback() {
    super.connectedCallback()

    if (this.filePath) {
      this.mimeType = `audio/${getFileExtension(this.filePath)}`
    }
  }

  render() {
    return html`
      <div class="app">
        <audio class="content" controls>
          <source src="${this.filePath}" type="${this.mimeType}"/>
        </audio>
      </div>`
  }
}