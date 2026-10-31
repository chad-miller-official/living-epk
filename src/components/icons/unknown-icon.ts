import {customElement} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import type {EpkApp} from "../app.ts";
import {DisallowFlags, type LaunchOptions} from "../../lib/events.ts";
import {EpkAlert} from "../apps/alert.ts";
import {getLinkName} from "../../lib/fs.ts";

@customElement('unknown-icon')
export class UnknownIcon extends EpkIcon {
  icon = '/img/unknown.ico'

  getAppInstance(): Promise<EpkApp> {
    return new Promise<EpkAlert>(resolve => {
      const alert = new EpkAlert()
      alert.windowTitle = 'Windows'
      alert.message = `Windows cannot open this file: '${getLinkName(this.fileLinkNode!)}'`
      alert.playSound = false
      alert.alertGraphic = '/img/search-file.ico'
      return resolve(alert)
    })
  }

  getLaunchOptions(): LaunchOptions {
    return {
      width: Math.min((33 + getLinkName(this.fileLinkNode!).length) * 7, 500),
      disallowFlags: DisallowFlags.DisallowAll,
      centered: true,
    }
  }
}