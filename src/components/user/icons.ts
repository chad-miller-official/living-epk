import {customElement} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import type {EpkApp} from "../../apps/base.ts";
import {FileExplorer} from "../../apps/file-explorer.ts";
import {AudioPlayer} from "../../apps/audio-player.ts";

@customElement('my-documents-icon')
export class MyDocumentsIcon extends EpkIcon {
  title = 'My Documents'
  icon = '/img/792.ico'

  getAppInstance(): EpkApp {
    return new FileExplorer()
  }
}

@customElement('music-icon')
export class MusicIcon extends EpkIcon {
  icon = '/img/1135.ico'

  constructor(title: string) {
    super()
    this.title = title
  }

  getAppInstance(): EpkApp {
    return new AudioPlayer()
  }
}