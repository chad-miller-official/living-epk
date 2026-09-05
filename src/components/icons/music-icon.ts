import {AudioPlayer} from "../apps/audio-player.ts";
import {customElement} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import {getFileName} from "../../lib/fs.ts";
import type {EpkApp} from "../app.ts";

@customElement('music-icon')
export class MusicIcon extends EpkIcon {
  icon = '/img/1135.ico'

  getAppInstance(): Promise<EpkApp> {
    return new Promise<AudioPlayer>(resolve => {
      const audioPlayer = new AudioPlayer()

      if (this.filePath) {
        audioPlayer.filePath = this.filePath
        audioPlayer.windowTitle = `Windows Media Player - ${getFileName(this.filePath)}`
      }

      return resolve(audioPlayer)
    })
  }
}