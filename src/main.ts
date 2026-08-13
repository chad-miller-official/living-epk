import 'xp.css/dist/XP.css'

import './components/desktop.ts'
import './components/icon.ts'
import './components/window.ts'

import './components/user/file-explorer-icon.ts'
import './components/user/file-explorer-toolbar.ts'
import './components/user/music-icon.ts'
import './components/user/notepad-toolbar.ts'

import {launchEvent} from "./lib/events.ts";
import {Notepad} from "./apps/notepad.ts";

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#desktop')!.dispatchEvent(
    launchEvent(
      () => new Promise(resolve => resolve(new Notepad('Hello, world!'))),
      400,
      300,
      80,
      80
    ),
  )
})