import {EpkIcon} from "../icon.ts";
import {customElement} from "lit/decorators.js";
import {InternetExplorer} from "../apps/internet-explorer.ts";
import type {LaunchOptions} from "../../lib/events.ts";
import type {EpkApp} from "../app.ts";

@customElement('document-reader-icon')
export class InternetExplorerIcon extends EpkIcon {
  icon = '/img/html-file.ico'

  getLaunchOptions(): LaunchOptions {
    return {
      width: 600,
      height: 400,
    }
  }

  getAppInstance(): Promise<EpkApp> {
    return new Promise<InternetExplorer>(resolve => {
      const internetExplorer = new InternetExplorer()

      if (this.fileLinkNode) {
        internetExplorer.url = this.fileLinkNode
      }

      return resolve(internetExplorer)
    })
  }
}