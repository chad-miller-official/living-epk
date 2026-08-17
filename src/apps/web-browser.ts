import {EpkApp} from "./base.ts";

export class WebBrowser extends EpkApp {
  windowIcon = ''
  windowTitle = ''

  srcDocument: string = ''

  constructor(srcDocument: string) {
    super()
    this.srcDocument = srcDocument
  }

  getWindowContents(): HTMLElement[] {
    const iframe = document.createElement('iframe')
    iframe.src = this.srcDocument
    iframe.title = this.windowTitle
    return [iframe]
  }
}