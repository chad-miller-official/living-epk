import {type Launch, launchEvent} from "./events.ts";
import {EpkAlert} from "../components/apps/dialog/alert.ts";
import type {EpkApp} from "../components/app.ts";
import {WindowRestriction} from "../components/window.ts";

export enum SystemSound {
  Click = '/audio/click.wav',
  Ding = '/audio/error.wav', // TODO FIXME XXX CHANGE TO ACTUAL SOUND
  Error = '/audio/error.wav',
}

export function playSound(sound: SystemSound) {
  return new Audio(sound).play()
}

function getAlertDialog(alerter: EpkApp, title: string, message: string): EpkAlert {
  const alert = alerter.spawnDialog(EpkAlert)
  alert.message = message
  alert.windowTitle = title
  return alert
}

function getAlertDialogLaunchArgs(message: string): Partial<Launch> {
  return {
    size: {width: Math.min(message.length * 5, 500)},
    location: 'center',
    disallowFlags: WindowRestriction.DisallowAll,
  }
}

export function alertDialog(alerter: EpkApp, title: string, message: string) {
  playSound(SystemSound.Error).then(() => {
    alerter.dispatchEvent(
      launchEvent(
        () => getAlertDialog(alerter, title, message),
        getAlertDialogLaunchArgs(message)
      )
    )
  })
}

export function warnDialog(alerter: EpkApp, title: string, message: string, args: Partial<EpkAlert> = {}) {
  alerter.dispatchEvent(
    launchEvent(() => {
        const alert = getAlertDialog(alerter, title, message)
        alert.alertGraphic = '/img/warn.ico'
        alert.silenceId = args.silenceId
        return alert
      },
      getAlertDialogLaunchArgs(message)
    )
  )
}