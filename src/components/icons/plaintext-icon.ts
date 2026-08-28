import {customElement} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import {Notepad} from "../apps/notepad.ts";
import type {LitElement} from "lit";
import {getFileName} from "../../lib/fs.ts";

@customElement('plaintext-icon')
export class PlainTextIconElement extends EpkIcon {
  icon = '/img/511.ico'

  async getAppInstance(): Promise<LitElement> {
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