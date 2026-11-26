import {customElement} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import type {EpkApp} from "../app.ts";
import {EpkAlert} from "../apps/dialog/alert.ts";
import {getLinkName} from "../../lib/fs.ts";
import {DisallowFlags} from "../window.ts";
import type {Launch} from "../../lib/events.ts";

@customElement('unknown-icon')
export class UnknownIcon extends EpkIcon {
  icon = '/img/icons/unknown.ico'

  getAppInstance(): EpkApp {
    const alert = new EpkAlert()
    alert.windowTitle = 'Windows'
    alert.message = `Windows cannot open this file: '${getLinkName(this.fileLinkNode!)}'`
    alert.alertGraphic = '/img/search-file.ico'
    return alert
  }

  getLaunchOptions(): Omit<Launch, 'init'> {
    return {
      size: {width: Math.min((33 + getLinkName(this.fileLinkNode!).length) * 7, 500)},
      location: 'center',
      disallowFlags: DisallowFlags.DisallowAll,
    }
  }
}