import 'xp.css/dist/XP.css'

import './components/desktop.ts'
import './components/icon.ts'
import './components/ui/toolbar.ts'
import './components/window.ts'

import './components/icons/file-explorer-icon.ts'
import './components/icons/internet-explorer-icon.ts'
import './components/icons/media-icon.ts'
import './components/icons/plaintext-icon.ts'

import {launchEvent} from "./lib/events.ts";

import {Notepad} from "./components/apps/notepad.ts";
import {initDb, LinkNodeType} from "./lib/fs.ts";

document.addEventListener('DOMContentLoaded', async () => {
  await initDb()

  document.querySelector('#desktop')!.dispatchEvent(
    launchEvent(
      () => {
        const notepad = new Notepad()

        notepad.fileLinkNode = {
          type: LinkNodeType.File,
          physicalPath: '/fs/plaintext/Welcome to my zone.txt',
          logicalPath: 'C:\\Users\\Chad\\My Documents\\Welcome to my zone.txt',
        }

        notepad.windowTitle = 'Notepad - Welcome to my zone'
        return notepad
      },
      {
        location: {
          x: 260,
          y: 60
        },
        size: {
          width: 550,
          height: 500,
        },
      },
    ),
  )

  const splash = document.querySelector('#splash') as HTMLDivElement
  splash.style.display = 'none'
})