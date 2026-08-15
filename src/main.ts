import 'xp.css/dist/XP.css'

import './components/desktop.ts'
import './components/icon.ts'
import './components/window.ts'

import './components/user/file-explorer-icon.ts'
import './components/user/file-explorer-toolbar.ts'
import './components/user/music-icon.ts'
import './components/user/notepad-toolbar.ts'
import './components/user/plaintext-icon.ts'

import {launchEvent} from "./lib/events.ts";
import {Notepad} from "./apps/notepad.ts";

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#desktop')!.dispatchEvent(
    launchEvent(
      async () => {
        const response = await fetch('/fs/plaintext/Welcome to my zone.txt')
        const text = await response.text()
        return new Notepad(text, 'Welcome to my zone.txt')
      },
      550,
      450,
      260,
      60
    ),
  )
})