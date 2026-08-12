import {customElement, property} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import type {EpkApp} from "../../apps/base.ts";
import {FileExplorer} from "../../apps/file-explorer.ts";
import {AudioPlayer} from "../../apps/audio-player.ts";

@customElement('file-explorer-icon')
export class FileExplorerIcon extends EpkIcon {
  @property({type: String})
  windowIcon = '/img/795.ico'

  getAppInstance(): EpkApp {
    return new FileExplorer(this.title, this.windowIcon, new MusicIcon('weirdcore2.wav'))
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