import {DisallowFlags, launchEvent} from "./events.ts";
import {EpkAlert} from "../components/apps/alert.ts";

export function alertDialog(alerter: Element, title: string, message: string) {
  alerter.dispatchEvent(launchEvent(() => new Promise<EpkAlert>(resolve => {
    const alert = new EpkAlert()
    alert.windowTitle = title
    alert.message = message
    resolve(alert)
  }), {
    width: Math.min(message.length * 6, 500),
    disallowFlags: DisallowFlags.DisallowAll,
    centered: true,
  }))
}