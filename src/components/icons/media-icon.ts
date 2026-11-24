import {MediaPlayer} from "../apps/media-player.ts";
import {customElement} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import type {EpkApp} from "../app.ts";
import {DisallowFlags, type LaunchOptions} from "../../lib/events.ts";
import {getFileExtension, getLinkName} from "../../lib/fs.ts";

@customElement('media-icon')
export class MediaIcon extends EpkIcon {
  getLaunchOptions(): LaunchOptions {
    const fileType = (this.fileLinkNode ? getFileExtension(this.fileLinkNode) : null) || ''

    if (fileType.match(/mp4|webm/)) {
      return {
        height: 400,
        width: 600,
      }
    } else {
      return {
        height: 146,
        width: 400,
        disallowFlags: DisallowFlags.DisallowMaximize | DisallowFlags.DisallowVerticalResize,
      }
    }
  }

  getAppInstance(): Promise<EpkApp> {
    return new Promise<MediaPlayer>(resolve => {
      const mediaPlayer = new MediaPlayer()

      if (this.fileLinkNode) {
        mediaPlayer.fileLinkNode = this.fileLinkNode
        mediaPlayer.windowTitle = `Media Player - ${getLinkName(this.fileLinkNode)} (stopped)`
      }

      return resolve(mediaPlayer)
    })
  }
}