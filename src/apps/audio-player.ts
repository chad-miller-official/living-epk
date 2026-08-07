import {EpkApp} from "./base.ts";

export class AudioPlayer extends EpkApp {
  windowTitle = "Music Tape's"
  windowIcon = '/img/1137.ico'

  getWindowContents(): HTMLElement[] {
    const audioContainer = document.createElement('div')

    const audio = document.createElement('audio')
    audio.controls = true

    const source = document.createElement('source')
    source.src = '/audio/weirdcore2.wav'
    source.type = 'audio/wav'

    audio.appendChild(source)
    audioContainer.appendChild(audio)

    return [audioContainer]
  }

  getMinimumDimensions(): [number | null, number | null] {
    return [300, null]
  }
}