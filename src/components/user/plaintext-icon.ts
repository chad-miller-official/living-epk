import {customElement} from "lit/decorators.js";
import type {EpkApp} from "../../apps/base.ts";
import {EpkIcon} from "../icon.ts";
import {Notepad} from "../../apps/notepad.ts";

@customElement('plaintext-icon')
export class PlainTextIconElement extends EpkIcon {
  icon = '/img/511.ico'

  async getAppInstance(): Promise<EpkApp> {
    return new Promise(resolve => {
      const notepad = new Notepad()

      if (this.filePath) {
        notepad.filePath = this.filePath
      }

      resolve(notepad)
    })
  }
}