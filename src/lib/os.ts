import {launchEvent} from "./events.ts";
import {EpkAlert} from "../components/apps/dialog/alert.ts";
import type {EpkApp} from "../components/app.ts";
import {DisallowFlags} from "../components/window.ts";

function getAlertDialog(delegatingAppId: string, title: string, message: string): EpkAlert {
  const alert = new EpkAlert()
  alert.windowTitle = title
  alert.message = message
  alert.delegatingAppId = delegatingAppId
  return alert
}

function getAlertDialogLaunchArgs(message: string) {
  return {
    width: Math.min(message.length * 5, 500),
    disallowFlags: DisallowFlags.DisallowAll,
    centered: true,
  }
}

export function alertDialog(alerter: EpkApp, title: string, message: string) {
  alerter.dispatchEvent(
    launchEvent(() =>
        new Promise<EpkAlert>(resolve =>
          playError().then(() => resolve(getAlertDialog(alerter.getAppId(), title, message)))),
      getAlertDialogLaunchArgs(message)
    )
  )
}

export function warnDialog(alerter: EpkApp, title: string, message: string, args: Partial<EpkAlert> = {}) {
  alerter.dispatchEvent(
    launchEvent(() =>
        new Promise<EpkAlert>(resolve => {
          const alert = getAlertDialog(alerter.getAppId(), title, message)
          alert.alertGraphic = '/img/warn.ico'
          alert.silenceId = args.silenceId
          alert.buttonPosition = args.buttonPosition || undefined
          resolve(alert)
        }),
      getAlertDialogLaunchArgs(message)
    )
  )
}

export function playError() {
  return new Audio('/audio/error.wav').play()
}

export function playClick() {
  return new Audio('/audio/click.wav').play()
}