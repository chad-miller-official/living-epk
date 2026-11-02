import {EpkIcon} from "../icon.ts";
import {customElement} from "lit/decorators.js";
import {DocumentReader} from "../apps/document-reader.ts";
import type {LaunchOptions} from "../../lib/events.ts";
import type {EpkApp} from "../app.ts";
import {getLinkName} from "../../lib/fs.ts";

@customElement('document-reader-icon')
export class DocumentReaderIcon extends EpkIcon {
  icon = '/img/document.ico'

  getLaunchOptions(): LaunchOptions {
    return {
      width: 600,
      height: 400,
    }
  }

  getAppInstance(): Promise<EpkApp> {
    return new Promise<DocumentReader>(resolve => {
      const markdownReader = new DocumentReader()

      if (this.fileLinkNode) {
        markdownReader.srcDocument = this.fileLinkNode.path
        markdownReader.windowTitle = `Document Viewer - ${getLinkName(this.fileLinkNode, false)}`
      }

      return resolve(markdownReader)
    })
  }
}