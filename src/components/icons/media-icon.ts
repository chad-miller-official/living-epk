import {MediaPlayer} from "../apps/media-player.ts";
import {customElement} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import type {EpkApp} from "../app.ts";
import {getFileExtension, getLinkName} from "../../lib/fs.ts";
import {WindowRestriction} from "../window.ts";

@customElement('media-icon')
export class MediaIcon extends EpkIcon {
  getLaunchOptions() {
    const fileType = (this.fileLinkNode ? getFileExtension(this.fileLinkNode) : null) || ''

    if (fileType.match(/mp4|webm/)) {
      return {
        size: {
          height: 400,
          width: 600,
        }
      }
    } else {
      return {
        size: {
          height: 146,
          width: 400,
        },
        disallowFlags: WindowRestriction.DisallowMaximize | WindowRestriction.DisallowVerticalResize,
      }
    }
  }

  getAppInstance(): EpkApp {
    const mediaPlayer = new MediaPlayer()

    if (this.fileLinkNode) {
      mediaPlayer.fileLinkNode = this.fileLinkNode
      mediaPlayer.windowTitle = `Media Player - ${getLinkName(this.fileLinkNode)} (stopped)`
    }

    return mediaPlayer
  }
}