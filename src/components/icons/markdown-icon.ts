import type {EpkApp} from "../app.ts";
import {EpkIcon} from "../icon.ts";
import {customElement} from "lit/decorators.js";
import {MarkdownReader} from "../apps/markdown-reader.ts";
import type {LaunchOptions} from "../../lib/events.ts";

@customElement('markdown-icon')
export class MarkdownIcon extends EpkIcon {
  getLaunchOptions(): LaunchOptions {
    return {
      width: 600,
      height: 400,
    }
  }

  getAppInstance(): Promise<EpkApp> {
    return new Promise<MarkdownReader>(resolve => resolve(new MarkdownReader(this.filePath!!)))
  }
}