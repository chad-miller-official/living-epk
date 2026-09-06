import {customElement} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import {Notepad} from "../apps/notepad.ts";
import {getFileName} from "../../lib/fs.ts";
import type {EpkApp} from "../app.ts";

@customElement('plaintext-icon')
export class PlainTextIconElement extends EpkIcon {
  icon = '/img/notepad.ico'

  async getAppInstance(): Promise<EpkApp> {
    return new Promise(resolve => {
      const notepad = new Notepad()
      notepad.windowTitle = `Notepad - ${this.filePath ? getFileName(this.filePath, false) : 'Untitled'}`

      if (this.filePath) {
        notepad.filePath = this.filePath
      }

      resolve(notepad)
    })
  }
}