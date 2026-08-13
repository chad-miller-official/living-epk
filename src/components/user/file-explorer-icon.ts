import {customElement, property} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import type {EpkApp} from "../../apps/base.ts";
import {FileExplorer} from "../../apps/file-explorer.ts";
import {MusicIcon} from "./music-icon.ts";

type FsPath = {
  path: string,
  displayPath: string,
}

type FsSpec = {
  displayRoot: string,
  paths: FsPath[],
}

const getFileExtension = (path: string) => path.split('.').pop()

@customElement('file-explorer-icon')
export class FileExplorerIcon extends EpkIcon {
  @property({type: String})
  windowIcon = '/img/795.ico'

  @property({type: String})
  fsSpecJson: string = '/'

  async getAppInstance(): Promise<EpkApp> {
    const fsDataResponse = await fetch(this.fsSpecJson)

    if (!fsDataResponse.ok) {
      // TODO this should bring up a Windows XP-style alert
      alert(`Failed to get file system data (tried loading "${this.fsSpecJson}")`)
    }

    const fsData: FsSpec = await fsDataResponse.json()

    const files = fsData.paths.map(path => {
      const extension = getFileExtension(path.path)
      let icon: EpkIcon

      switch (extension) {
        case 'wav':
          icon = new MusicIcon(path.displayPath)
          break
        default:
          throw new Error(`Unhandled extension: ${extension}`)
      }

      return icon
    })

    return new FileExplorer(this.title, this.windowIcon, ...files)
  }
}
