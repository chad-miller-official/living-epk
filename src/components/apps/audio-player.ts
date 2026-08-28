import {getFileExtension} from "../../lib/fs.ts";
import {appStyles} from "../ui.ts";
import {customElement, property, state} from "lit/decorators.js";
import {css, html, LitElement} from "lit";

@customElement('audio-player')
export class AudioPlayer extends LitElement {
  static styles = [
    ...appStyles,
    css`
      audio {
        width: 100%;
      }
    `
  ]

  @property({type: String})
  windowTitle = 'Windows Media Player'

  @property({type: String})
  windowIcon = '/img/1137.ico'

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