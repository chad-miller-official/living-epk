import {AudioPlayer} from "../apps/audio-player.ts";
import {customElement} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import {getFileName} from "../../lib/fs.ts";
import type {EpkApp} from "../app.ts";
import {DisallowFlags, type LaunchOptions} from "../../lib/events.ts";

@customElement('music-icon')
export class MusicIcon extends EpkIcon {
  icon = '/img/audio-player.ico'

  getLaunchOptions(): LaunchOptions {
    return {
      height: 144,
      width: 400,
      disallowFlags: DisallowFlags.DisallowMaximize | DisallowFlags.DisallowHorizontalResize,
    }
  }

  getAppInstance(): Promise<EpkApp> {
    return new Promise<AudioPlayer>(resolve => {
      const audioPlayer = new AudioPlayer()

      if (this.filePath) {
        audioPlayer.filePath = this.filePath
        audioPlayer.windowTitle = `Media Player - ${getFileName(this.filePath)} (stopped)`
      }

      return resolve(audioPlayer)
    })
  }
}