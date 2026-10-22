import {AudioPlayer} from "../apps/audio-player.ts";
import {customElement} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import type {EpkApp} from "../app.ts";
import {DisallowFlags, type LaunchOptions} from "../../lib/events.ts";
import {getLinkName} from "../../lib/fs.ts";

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

      if (this.fileLinkNode) {
        audioPlayer.fileLinkNode = this.fileLinkNode
        audioPlayer.windowTitle = `Media Player - ${getLinkName(this.fileLinkNode)} (stopped)`
      }

      return resolve(audioPlayer)
    })
  }
}