import {customElement} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import {FileExplorer} from "../apps/file-explorer.ts";
import type {EpkApp} from "../app.ts";

@customElement('file-explorer-icon')
export class FileExplorerIcon extends EpkIcon {
  icon = {
    small: '/img/icons/small/file-explorer-small.ico',
    large: '/img/icons/file-explorer.ico',
  }

  getLaunchOptions() {
    return {
      size: {
        width: 600,
        height: 400,
      },
    }
  }

  getAppInstance(): EpkApp {
    const fileExplorer = new FileExplorer()

    if (this.fileLinkNode) {
      fileExplorer.path = this.fileLinkNode.physicalPath
    }

    return fileExplorer
  }
}
