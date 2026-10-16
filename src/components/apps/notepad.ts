import {customElement, property, query, state} from "lit/decorators.js";
import {css, html, nothing} from "lit";
import {type ToolbarMenu, ToolbarUiElement} from "../../lib/toolbar.ts";
import {Task} from "@lit/task";
import {EpkApp} from "../app.ts";
import dayjs from "dayjs";
import {closeWindowEvent, DisallowFlags, launchEvent} from "../../lib/events.ts";
import {AppAbout} from "./about.ts";
import {FilePicker} from "./file-picker.ts";
import type {FsPath} from "../../lib/fs.ts";

@customElement('notepad-app')
export class Notepad extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    css`
      #notepad {
        font-family: monospace;
        font-size: 12pt;
        overflow: scroll;
        resize: none;
      }
    `
  ]

  @property({type: String})
  filePath?: FsPath

  @property({type: String})
  windowTitle = 'Notepad'

  @property({type: String})
  windowIcon = '/img/notepad-small.ico'

  @property({type: Number})
  currentLine = 1

  @property({type: Number})
  currentColumn = 1

  @query('#notepad')
  textArea!: HTMLTextAreaElement

  @state()
  showStatusBar = true

  toolbarSpec: ToolbarMenu[] = [
    {
      text: 'File',
      items: [
        {
          text: 'New', shortcut: 'Ctrl+N', action: () => {
          },
        },
        {
          text: 'Open', shortcut: 'Ctrl+O', action: (event: Event) => {
            event.stopPropagation()
            this.toolbar!.closeAll()

            const filePicker = new FilePicker()
            filePicker.fsSpecPath = '/data/my-documents.json'
            filePicker.onFilePick = (path) => this.filePath = path

            const plaintextFilterRegex = '[.]txt$'

            filePicker.fileTypeFilters = [{
              regex: plaintextFilterRegex,
              label: 'Plain text (*.txt)',
              selected: true
            }]

            filePicker.filterRegex = new RegExp(plaintextFilterRegex)

            this.dispatchEvent(launchEvent(() => new Promise<FilePicker>(resolve => resolve(filePicker)), {
              width: 350,
              height: 250,
              disallowFlags: DisallowFlags.DisallowMaximize | DisallowFlags.DisallowMinimize,
            }))
          },
        },
        {
          text: 'Save', shortcut: 'Ctrl+S',
        },
        {
          text: 'Save As...', shortcut: 'Ctrl+Shift+S',
        },
        ToolbarUiElement.DIVIDER,
        {
          text: 'Print...', shortcut: 'Ctrl+P', action: () => window.print(),
        },
        ToolbarUiElement.DIVIDER,
        {
          text: 'Exit', action: () => this.dispatchEvent(closeWindowEvent()),
        },
      ]
    },
    {
      text: 'Edit',
      items: [
        {
          text: 'Undo', shortcut: 'Ctrl+Z', action: () => {
            document.execCommand('undo')
          },
        },
        {
          text: 'Cut', shortcut: 'Ctrl+X', action: () => {
            const start = this.textArea.selectionStart
            const end = this.textArea.selectionEnd

            if (start !== end) {
              const selection = this.textArea.value.substring(start, end)

              navigator.clipboard.writeText(selection).then(() => {
                this.textArea.focus()
                document.execCommand('insertText', false, '')
              })
            }
          },
        },
        {
          text: 'Copy', shortcut: 'Ctrl+C', action: () => {
            const start = this.textArea.selectionStart
            const end = this.textArea.selectionEnd

            if (start !== end) {
              const selection = this.textArea.value.substring(start, end)
              navigator.clipboard.writeText(selection)
            }
          },
        },
        {
          text: 'Paste', shortcut: 'Ctrl+V', action: () => {
            navigator.clipboard.readText().then(text => {
              this.textArea.focus()
              document.execCommand('insertText', false, text)
            })
          },
        },
        {
          text: 'Delete', shortcut: 'Del', action: () => {
            this.textArea.focus()
            document.execCommand('insertText', false, '')
          },
        },
        ToolbarUiElement.DIVIDER,
        {
          text: 'Select All', shortcut: 'Ctrl+A', action: () => this.textArea.select(),
        },
        {
          text: 'Time/Date', shortcut: 'F5', action: () => {
            this.textArea.focus()
            document.execCommand('insertText', false, dayjs().format('h:mm A M/D/YYYY'))
          },
        },
      ],
    },
    {
      text: 'View',
      items: [
        {
          text: 'Status Bar',
          action: () => this.showStatusBar = !this.showStatusBar,
          selected: () => this.showStatusBar,
        },
      ],
    },
    {
      text: 'Help',
      items: [
        {
          text: 'About Notepad',
          action: (event: Event) => {
            event.stopPropagation()
            this.toolbar!.closeAll()

            const about = new AppAbout()
            about.appName = 'Microsoft &reg; Notepad'
            about.appIcon = '/img/notepad.ico'
            about.windowTitle = 'About Notepad'

            this.dispatchEvent(launchEvent(() => new Promise<AppAbout>(resolve => resolve(about)), {
              width: 419,
              height: 350,
              disallowFlags: DisallowFlags.DisallowAll,
            }))
          },
        },
      ],
    },
  ]

  private noteTask = new Task(this, {
    task: async ([path], {signal}) => {
      if (!this.filePath) {
        return ''
      }

      const response = await fetch(path!.path, {signal})

      if (!response.ok) {
        alert('Error') // TODO XXX FIXME
      }

      return await response.text()
    },
    args: () => [this.filePath],
  })

  calculatePosition() {
    const lines = this.textArea.value
      .substring(0, this.textArea.selectionStart)
      .split('\n')

    this.currentLine = lines.length
    this.currentColumn = lines[lines.length - 1].length + 1
  }

  render() {
    return this.noteTask.render({
      pending: () => html`
        <div class="app">
          <div class="content"></div>
        </div>`,
      complete: (textValue) => html`
        <div class="app" @click="${this.handleClick}">
          <epk-toolbar id="toolbar" .toolbarSpec="${this.toolbarSpec}"></epk-toolbar>
          <textarea id="notepad" class="content" wrap="off" .value="${textValue}"
                    @click="${this.calculatePosition}"
                    @keyup="${this.calculatePosition}"></textarea>
          ${this.showStatusBar ? html`
            <div class="status-bar">
              <p class="status-bar-field spacer"></p>
              <p class="status-bar-field">Ln ${this.currentLine}, Col ${this.currentColumn}</p>
            </div>` : nothing}
        </div>`,
      error: () => html`
        <div class="app">
          <div class="content">Error</div>
        </div>`,
    })
  }
}