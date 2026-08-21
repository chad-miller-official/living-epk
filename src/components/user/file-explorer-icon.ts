import {customElement, property} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import type {EpkApp} from "../../apps/base.ts";
import {FileExplorer} from "../../apps/file-explorer.ts";

@customElement('file-explorer-icon')
export class FileExplorerIcon extends EpkIcon {
  @property({type: String})
  windowIcon = '/img/795.ico'

  getAppInstance(): Promise<EpkApp> {
    return new Promise<FileExplorer>(resolve => resolve(new FileExplorer(this.filePath)))
  }
}
