import type {EpkApp} from "../../apps/base.ts";
import {EpkIcon} from "../icon.ts";
import {customElement, property} from "lit/decorators.js";
import {WebBrowser} from "../../apps/web-browser.ts";

@customElement('html-icon')
export class HtmlIcon extends EpkIcon {
  @property({type: String})
  filePath = ''

  constructor(filePath: string) {
    super()
    this.filePath = filePath
  }

  async getAppInstance(): Promise<EpkApp> {
    return new Promise<WebBrowser>(resolve => resolve(new WebBrowser(this.filePath)))
  }
}