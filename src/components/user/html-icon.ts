import type {EpkApp} from "../../apps/base.ts";
import {EpkIcon} from "../icon.ts";
import {customElement} from "lit/decorators.js";
import {WebBrowser} from "../../apps/web-browser.ts";
import type {LaunchOptions} from "../../lib/events.ts";

@customElement('html-icon')
export class HtmlIcon extends EpkIcon {
  getLaunchOptions(): LaunchOptions {
    return {
      width: 600,
      height: 400,
    }
  }

  getAppInstance(): Promise<EpkApp> {
    return new Promise<WebBrowser>(resolve => resolve(new WebBrowser(this.filePath!!)))
  }
}