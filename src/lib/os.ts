import {type Launch, launchEvent} from "./events.ts";
import {EpkAlert} from "../components/apps/dialog/alert.ts";
import type {EpkApp} from "../components/app.ts";
import {DisallowFlags} from "../components/window.ts";

export enum SystemSound {
  Error = '/audio/error.wav',
  Click = '/audio/click.wav',
  Ding = '/audio/error.wav', // TODO FIXME XXX CHANGE TO ACTUAL SOUND
}

export function playSound(sound: SystemSound) {
  return new Audio(sound).play()
}

function getAlertDialog(delegatingAppId: string, title: string, message: string): EpkAlert {
  const alert = new EpkAlert()
  alert.windowTitle = title
  alert.message = message
  alert.delegatingAppId = delegatingAppId
  return alert
}

function getAlertDialogLaunchArgs(message: string): Partial<Launch> {
  return {
    size: {width: Math.min(message.length * 5, 500)},
    location: 'center',
    disallowFlags: DisallowFlags.DisallowAll,
  }
}

export function alertDialog(alerter: EpkApp, title: string, message: string) {
  playSound(SystemSound.Error).then(() => {
    alerter.dispatchEvent(
      launchEvent(
        () => getAlertDialog(alerter.getAppId(), title, message),
        getAlertDialogLaunchArgs(message)
      )
    )
  })
}

export function warnDialog(alerter: EpkApp, title: string, message: string, args: Partial<EpkAlert> = {}) {
  alerter.dispatchEvent(
    launchEvent(() => {
        const alert = getAlertDialog(alerter.getAppId(), title, message)
        alert.alertGraphic = '/img/warn.ico'
        alert.silenceId = args.silenceId
        alert.buttonPosition = args.buttonPosition || undefined
        return alert
      },
      getAlertDialogLaunchArgs(message)
    )
  )
}