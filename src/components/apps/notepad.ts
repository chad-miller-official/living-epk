import {EpkApp} from "../app.ts";
import {customElement, property, state} from "lit/decorators.js";
import {css, html, LitElement, unsafeCSS} from "lit";
import {EpkStatusBar, EpkToolbar} from "../ui.ts";
import xpStyle from "xp.css/dist/XP.css?inline";
import {type ToolbarMenu, ToolbarUiElement} from "../../lib/toolbar.ts";
import {windowTitleChangeEvent} from "../../lib/events.ts";
import {getFileName} from "../../lib/fs.ts";
import {Task} from "@lit/task";

@customElement('notepad-toolbar')
export class NotepadToolbar extends EpkToolbar {
  static styles = EpkToolbar.styles

  getToolbarSpec(): ToolbarMenu[] {
    return [
      {
        text: 'File',
        items: [
          {
            text: 'New',
            shortcut: 'Ctrl+N',
            action: () => {
            },
          },
          {
            text: 'Open',
            shortcut: 'Ctrl+O',
            action: () => {
            },
          },
          {
            text: 'Save',
            shortcut: 'Ctrl+S',
            action: () => {
            },
          },
          {
            text: 'Save As...',
            shortcut: 'Ctrl+Shift+S',
            action: () => {
            },
          },
          ToolbarUiElement.DIVIDER,
          {
            text: 'Page Setup...',
            action: () => {
            },
          },
          {
            text: 'Print...',
            shortcut: 'Ctrl+P',
            action: () => {
            },
          },
          ToolbarUiElement.DIVIDER,
          {
            text: 'Exit',
            action: () => {
            },
          },
        ]
      },
      {
        text: 'Edit',
        items: [
          {
            text: 'Undo',
            shortcut: 'Ctrl+Z',
            action: () => {
            },
          },
          {
            text: 'Cut',
            shortcut: 'Ctrl+X',
            action: () => {
            },
          },
          {
            text: 'Copy',
            shortcut: 'Ctrl+C',
            action: () => {
            },
          },
          {
            text: 'Paste',
            shortcut: 'Ctrl+V',
            action: () => {
            },
          },
          {
            text: 'Delete',
            shortcut: 'Del',
            action: () => {
            },
          },
          ToolbarUiElement.DIVIDER,
          {
            text: 'Find',
            shortcut: 'Ctrl+F',
            action: () => {
            },
          },
          {
            text: 'Find Next',
            shortcut: 'F3',
            action: () => {
            },
          },
          {
            text: 'Replace...',
            shortcut: 'Ctrl+H',
            action: () => {
            },
          },
          {
            text: 'Go To...',
            shortcut: 'Ctrl+G',
            action: () => {
            },
          },
          ToolbarUiElement.DIVIDER,
          {
            text: 'Select All',
            shortcut: 'Ctrl+A',
            action: () => {
            },
          },
          {
            text: 'Time/Date',
            shortcut: 'F5',
            action: () => {
            },
          },
        ],
      },
      {
        text: 'Format',
        items: [
          {
            text: 'Word Wrap',
            action: () => {
            },
          },
          {
            text: 'Font...',
            action: () => {
            },
          },
        ],
      },
      {
        text: 'View',
        items: [
          {
            text: 'Status Bar',
            action: () => {
            },
          },
        ],
      },
      {
        text: 'Help',
        items: [
          {
            text: 'Help Topics',
            action: () => {
            },
          },
          ToolbarUiElement.DIVIDER,
          {
            text: 'About Notepad',
            action: () => {
            },
          },
        ],
      },
    ]
  }
}

@customElement('notepad-editor')
export class NotepadEditor extends LitElement {
  static styles = [
    unsafeCSS(xpStyle),
    css`
      .notepad-app {
        font-family: monospace;
        font-size: 12pt;
        height: 100%;
        resize: none;
        width: 100%;
      }
    `
  ]

  @property({type: String})
  filePath = ''

  private noteTask = new Task(this, {
    task: async ([path], {signal}) => {
      const response = await fetch(path, {signal})

      if (!response.ok) {
        alert('Error') // TODO XXX FIXME
      }

      return await response.text()
    },
    args: () => [this.filePath],
  })

  render() {
    return this.noteTask.render({
      pending: () => html`
        <textarea id="content" class="notepad-app"></textarea>`,
      complete: (textValue) => html`
        <textarea id="content" class="notepad-app" wrap="off" .value="${textValue}"></textarea>`,
      error: () => html`
        <div>Error</div>`,
    })
  }
}

@customElement('notepad-status-bar')
export class NotepadStatusBar extends EpkStatusBar {
  static styles = [
    ...EpkStatusBar.styles,
    css`
      .spacer {
        width: 40%;
      }
    `
  ]

  render() {
    return html`
      <div class="status-bar">
        <p class="status-bar-field spacer"></p>
        <p class="status-bar-field">Ln 1, Col 1</p>
      </div>
    `
  }
}

@customElement('notepad-app')
export class Notepad extends EpkApp {
  static styles = EpkApp.styles

  @state()
  initialText: string = ''

  windowIcon = '/img/513.ico'
  windowTitle = ''

  filePath: string | undefined

  private _toolbar: NotepadToolbar | null = null
  private _editor: NotepadEditor | undefined
  private _statusBar: NotepadStatusBar | null = null

  constructor(filePath?: string) {
    super()
    this.filePath = filePath
  }

  connectedCallback() {
    super.connectedCallback()

    this._toolbar = new NotepadToolbar()

    this._editor = new NotepadEditor()
    this._editor.filePath = this.filePath!!

    this._statusBar = new NotepadStatusBar()
  }

  firstUpdated() {
    const title = this.filePath ? `ICOT? Notepad - ${getFileName(this.filePath, false)}` : 'Untitled'
    this.dispatchEvent(windowTitleChangeEvent(title))
  }

  getToolbar(): EpkToolbar | null {
    return this._toolbar
  }

  getWindowContents(): LitElement {
    return this._editor!
  }

  getStatusBar(): EpkStatusBar | null {
    return this._statusBar
  }

  getMinimumDimensions(): [number | null, number | null] {
    return [400, 200]
  }
}