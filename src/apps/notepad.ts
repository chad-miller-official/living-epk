import {EpkApp} from "./base.ts";
import {EpkToolbar} from "../components/toolbar.ts";
import {NotepadToolbar} from "../components/user/notepad-toolbar.ts";

export class Notepad extends EpkApp {
  windowIcon = '/img/513.ico';
  windowTitle = ''

  textContent: string = ''
  toolbar: EpkToolbar | undefined

  constructor(initialText: string, initialTitle: string = 'Untitled') {
    super()
    this.textContent = initialText
    this.windowTitle = initialTitle
  }

  getToolbar(): EpkToolbar {
    if (!this.toolbar) {
      this.toolbar = new NotepadToolbar()
    }
    
    return this.toolbar
  }

  getWindowContents(): HTMLElement[] {
    const textarea = document.createElement("textarea")
    textarea.classList.add("notepad-app")
    textarea.value = this.textContent
    textarea.wrap = "off"
    return [textarea]
  }

  getStatusBarItems(): HTMLParagraphElement[] {
    const spacer = document.createElement("p")
    spacer.classList.add("notepad-app", "spacer")

    const position = document.createElement('p')
    position.innerText = 'Ln 1, Col 1'

    return [spacer, position]
  }

  getMinimumDimensions(): [number | null, number | null] {
    return [400, 200]
  }
}