import {customElement} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import {Notepad} from "../apps/notepad.ts";
import type {EpkApp} from "../app.ts";
import {getLinkName} from "../../lib/fs.ts";

@customElement('plaintext-icon')
export class PlainTextIcon extends EpkIcon {
  icon = {
    small: '/img/icons/small/notepad-small.ico',
    large: '/img/icons/notepad.ico',
  }

  getAppInstance(): EpkApp {
    const notepad = new Notepad()
    notepad.windowTitle = `Notepad - ${this.fileLinkNode ? getLinkName(this.fileLinkNode, false) : 'Untitled'}`
    notepad.fileLinkNode = this.fileLinkNode
    return notepad
  }
}