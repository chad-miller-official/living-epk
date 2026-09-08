import {customElement, property} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import {FileExplorer} from "../apps/file-explorer.ts";
import type {EpkApp} from "../app.ts";
import type {LaunchOptions} from "../../lib/events.ts";

@customElement('file-explorer-icon')
export class FileExplorerIcon extends EpkIcon {
  @property({type: String})
  icon = '/img/file-explorer.ico'

  @property({type: String})
  windowIcon = '/img/file-explorer-small.ico'

  getLaunchOptions(): LaunchOptions {
    return {
      width: 600,
      height: 400,
    }
  }

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
