import {EpkIcon} from "../icon.ts";
import {customElement} from "lit/decorators.js";
import {InternetExplorer} from "../apps/internet-explorer.ts";
import type {EpkApp} from "../app.ts";

@customElement('internet-explorer-icon')
export class InternetExplorerIcon extends EpkIcon {
  icon = {
    small: '/img/icons/small/internet-explorer.ico', // TODO change to actual small icon
    large: '/img/icons/html-file.ico',
  }

  getLaunchOptions() {
    return {
      size: {
        width: 600,
        height: 400,
      }
    }
  }

  getAppInstance(): EpkApp {
    const internetExplorer = new InternetExplorer()

    if (this.fileLinkNode) {
      internetExplorer.path = this.fileLinkNode
    }

    return internetExplorer
  }
}