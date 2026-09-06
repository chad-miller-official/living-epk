import {customElement, property} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import {FileExplorer} from "../apps/file-explorer.ts";
import type {EpkApp} from "../app.ts";

@customElement('file-explorer-icon')
export class FileExplorerIcon extends EpkIcon {
  @property({type: String})
  icon = '/img/file-explorer.ico'

  @property({type: String})
  windowIcon = '/img/file-explorer-small.ico'

  getAppInstance(): Promise<EpkApp> {
    return new Promise<FileExplorer>(resolve => {
      const fileExplorer = new FileExplorer()
      fileExplorer.windowIcon = this.windowIcon

      if (this.filePath) {
        fileExplorer.filePath = this.filePath
      }

      return resolve(fileExplorer)
    })
  }
}
