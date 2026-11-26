import {customElement, property} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import {FileExplorer} from "../apps/file-explorer.ts";
import type {EpkApp} from "../app.ts";

@customElement('file-explorer-icon')
export class FileExplorerIcon extends EpkIcon {
  @property({type: String})
  icon = '/img/icons/file-explorer.ico'

  @property({type: String})
  windowIcon = '/img/icons/small/file-explorer-small.ico'

  getLaunchOptions() {
    return {
      size: {
        width: 600,
        height: 400,
      },
    }
  }

  getAppInstance(): Promise<EpkApp> {
    return new Promise<FileExplorer>(resolve => {
      const fileExplorer = new FileExplorer()
      fileExplorer.windowIcon = this.windowIcon

      if (this.fileLinkNode) {
        fileExplorer.path = this.fileLinkNode.physicalPath
      }

      return resolve(fileExplorer)
    })
  }
}
