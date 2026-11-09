import {DisallowFlags, launchEvent} from "./events.ts";
import {EpkAlert} from "../components/apps/alert.ts";

function getAlertDialog(title: string, message: string): EpkAlert {
  const alert = new EpkAlert()
  alert.windowTitle = title
  alert.message = message
  return alert
}

function getAlertDialogLaunchArgs(message: string) {
  return {
    width: Math.min(message.length * 5, 500),
    disallowFlags: DisallowFlags.DisallowAll,
    centered: true,
  }
}

export function alertDialog(alerter: Element, title: string, message: string) {
  alerter.dispatchEvent(
    launchEvent(() =>
        new Promise<EpkAlert>(resolve =>
          new Audio('/audio/error.wav')
            .play()
            .then(() => resolve(getAlertDialog(title, message)))),
      getAlertDialogLaunchArgs(message)
    )
  )
}

export function warnDialog(alerter: Element, title: string, message: string, args: Partial<EpkAlert> = {}) {
  alerter.dispatchEvent(
    launchEvent(() =>
        new Promise<EpkAlert>(resolve => {
          const alert = getAlertDialog(title, message)
          alert.alertGraphic = '/img/warn.ico'
          alert.silenceId = args.silenceId
          alert.buttonPosition = args.buttonPosition || undefined
          resolve(alert)
        }),
      getAlertDialogLaunchArgs(message)
    )
  )
}