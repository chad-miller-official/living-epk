import {EpkApp} from "./base.ts";
import {EpkToolbar} from "../components/toolbar.ts";
import {NotepadToolbar} from "../components/user/notepad-toolbar.ts";

export class Notepad extends EpkApp {
  windowIcon = '/img/513.ico';
  windowTitle = ''

  textContent: string = ''

  constructor(initialText: string, initialTitle: string = 'Untitled') {
    super()
    this.textContent = initialText
    this.windowTitle = initialTitle
  }

  getToolbar(): EpkToolbar {
    return new NotepadToolbar()
  }

  getWindowContents(): HTMLElement[] {
    const textarea = document.createElement("textarea")
    textarea.classList.add("notepad-app")
    textarea.innerText = this.textContent
    textarea.wrap = "off"
    return [textarea]
  }

  getStatusBarItems(): HTMLParagraphElement[] {
    const spacer = document.createElement("p")
    spacer.classList.add("notepad-app", "spacer")

    const position = document.createElement('p')
    position.innerText = 'Ln 1, Col 1'

    const zoom = document.createElement('p')
    zoom.innerText = '100%'

    const lineFeed = document.createElement('p')
    lineFeed.innerText = 'Windows (CRLF)'

    const characterSet = document.createElement('p')
    characterSet.innerText = 'UTF-8'

    return [spacer, position, zoom, lineFeed, characterSet]
  }

  getMinimumDimensions(): [number | null, number | null] {
    return [400, 200]
  }
}