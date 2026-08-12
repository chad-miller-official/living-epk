import {AudioPlayer} from "../../apps/audio-player.ts";
import type {EpkApp} from "../../apps/base.ts";
import {customElement} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";

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