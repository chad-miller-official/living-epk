import {customElement} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import {Notepad} from "../apps/notepad.ts";
import type {EpkApp} from "../app.ts";
import {getLinkName} from "../../lib/fs.ts";

@customElement('plaintext-icon')
export class PlainTextIcon extends EpkIcon {
  icon = '/img/notepad.ico'

  async getAppInstance(): Promise<EpkApp> {
    return new Promise(resolve => {
      const notepad = new Notepad()
      notepad.windowTitle = `Notepad - ${this.fileLinkNode ? getLinkName(this.fileLinkNode, false) : 'Untitled'}`

      if (this.fileLinkNode) {
        notepad.fileLinkNode = this.fileLinkNode
      }

      resolve(notepad)
    })
  }
}