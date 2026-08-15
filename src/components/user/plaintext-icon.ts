import {customElement, property} from "lit/decorators.js";
import type {EpkApp} from "../../apps/base.ts";
import {EpkIcon} from "../icon.ts";
import {Notepad} from "../../apps/notepad.ts";

@customElement('plaintext-icon')
export class PlainTextIconElement extends EpkIcon {
  icon = '/img/511.ico'

  @property({type: String})
  filePath: string | undefined

  async getAppInstance(): Promise<EpkApp> {
    if (this.filePath) {
      const fileName = this.filePath.split('/').pop()
      const response = await fetch(this.filePath)
      const text = await response.text()
      return new Notepad(text, fileName)
    }

    return new Promise(resolve => resolve(new Notepad('')))
  }
}