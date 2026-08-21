import {EpkApp} from "./base.ts";
import {getFileExtension} from "../lib/fs.ts";
import {EpkStatusBar, type EpkToolbar} from "../components/ui.ts";
import {customElement, property, state} from "lit/decorators.js";
import {css, html, LitElement, unsafeCSS} from "lit";
import xpStyle from "xp.css/dist/XP.css?inline";

@customElement('audio-renderer')
export class AudioRenderer extends LitElement {
  static styles = [
    unsafeCSS(xpStyle),
    css`
      audio {
        width: 100%;
      }
    `
  ]

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
      <div>
        <audio controls>
          <source src="${this.filePath}" type="${this.mimeType}"/>
        </audio>
      </div>
    `
  }
}

@customElement('audio-player')
export class AudioPlayer extends EpkApp {
  windowTitle = "ICOT? Media Player"
  windowIcon = '/img/1137.ico'

  @property({type: String})
  filePath: string | undefined

  player: AudioRenderer | undefined

  connectedCallback() {
    super.connectedCallback()

    this.player = new AudioRenderer()
    this.player.filePath = this.filePath
  }

  getToolbar(): EpkToolbar | null {
    return null
  }

  getWindowContents(): LitElement {
    return this.player!
  }

  getStatusBar(): EpkStatusBar | null {
    return null
  }

  getMinimumDimensions(): [number | null, number | null] {
    return [300, null]
  }
}