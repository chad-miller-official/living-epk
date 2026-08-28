import {EpkIcon} from "../icon.ts";
import {customElement} from "lit/decorators.js";
import {MarkdownReader} from "../apps/markdown-reader.ts";
import type {LaunchOptions} from "../../lib/events.ts";
import type {LitElement} from "lit";
import {getFileName} from "../../lib/fs.ts";

@customElement('markdown-icon')
export class MarkdownIcon extends EpkIcon {
  getLaunchOptions(): LaunchOptions {
    return {
      width: 600,
      height: 400,
    }
  }

  getAppInstance(): Promise<LitElement> {
    return new Promise<MarkdownReader>(resolve => {
      const markdownReader = new MarkdownReader()

      if (this.filePath) {
        markdownReader.srcDocument = this.filePath
        markdownReader.windowTitle = `Document Viewer - ${getFileName(this.filePath)}`
      }

      return resolve(markdownReader)
    })
  }
}