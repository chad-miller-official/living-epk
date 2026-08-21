import 'xp.css/dist/XP.css'

import './components/desktop.ts'
import './components/icon.ts'
import './components/ui.ts'
import './components/window.ts'

import './components/user/file-explorer-icon.ts'
import './components/user/html-icon.ts'
import './components/user/music-icon.ts'
import './components/user/plaintext-icon.ts'

import {launchEvent} from "./lib/events.ts";

import {Notepad} from "./apps/notepad.ts";

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#desktop')!.dispatchEvent(
    launchEvent(
      () => new Promise<Notepad>(resolve => {
        const notepad = new Notepad()
        notepad.filePath = '/fs/plaintext/Welcome to my zone.txt'
        resolve(notepad)
      }),
      {
        width: 550,
        height: 450,
        x: 260,
        y: 60
      },
    ),
  )
})