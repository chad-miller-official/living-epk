import {customElement, property} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import type {EpkApp} from "../../apps/base.ts";
import {FileExplorer} from "../../apps/file-explorer.ts";
import {MusicIcon} from "./music-icon.ts";

@customElement('file-explorer-icon')
export class FileExplorerIcon extends EpkIcon {
  @property({type: String})
  windowIcon = '/img/795.ico'

  getAppInstance(): EpkApp {
    return new FileExplorer(this.title, this.windowIcon, new MusicIcon('weirdcore2.wav'))
  }
}
