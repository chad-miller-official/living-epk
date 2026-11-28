import {customElement, property, query, state} from "lit/decorators.js";
import {css, html, nothing} from "lit";
import {Task} from "@lit/task";
import {EpkApp} from "../app.ts";
import dayjs from "dayjs";
import {closeWindowEvent, launchEvent, windowPropertyChangeEvent} from "../../lib/events.ts";
import {AppAbout} from "./dialog/about.ts";
import {getLinkName, type LinkNode} from "../../lib/fs.ts";
import {type ToolbarMenu, ToolbarUiElement} from "../ui/toolbar.ts";
import {type FilePickedHandler, FilePicker} from "./dialog/file-picker.ts";
import {WindowRestriction} from "../window.ts";
import {alertDialog} from "../../lib/os.ts";

@customElement('notepad-app')
export class Notepad extends EpkApp implements FilePickedHandler {
  static styles = [
    ...EpkApp.styles,
    css`
      #notepad {
        font-family: monospace;
        font-size: 12pt;
        overflow: scroll;
        resize: none;
      }`
  ]

  @query('#notepad')
  textArea!: HTMLTextAreaElement

  @property({type: Object})
  fileLinkNode?: LinkNode

  @property({type: String})
  windowTitle = 'Notepad - Untitled'

  @property({type: String})
  windowIcon = '/img/icons/small/notepad-small.ico'

  @state()
  currentLine = 1

  @state()
  currentColumn = 1

  @state()
  showStatusBar = true

  private toolbarSpec: ToolbarMenu[] = [
    {
      text: 'File',
      items: [
        {
          text: 'New',
          shortcut: 'Ctrl+N',
          action: () => this.dispatchEvent(launchEvent(() => new Notepad())),
        },
        {
          text: 'Open',
          shortcut: 'Ctrl+O',
          action: (event: Event) => {
            event.stopPropagation()

            this.dispatchEvent(launchEvent(() => {
              const filePicker = this.spawnDialog(FilePicker)
              filePicker.path = 'C:\\Users\\Chad\\My Documents'

              const plaintextFilterRegex = '[.]txt$'

              filePicker.fileTypeFilters = [{
                regex: plaintextFilterRegex,
                label: 'Plain text (*.txt)',
                selected: true
              }]

              filePicker.filterRegex = new RegExp(plaintextFilterRegex)
              return filePicker
            }, {
              size: {
                width: 500,
                height: 400,
              },
              disallowFlags: WindowRestriction.DisallowMaximize | WindowRestriction.DisallowMinimize,
            }))
          },
        },
        {
          text: 'Save', shortcut: 'Ctrl+S', disabled: true,
        },
        {
          text: 'Save As...', shortcut: 'Ctrl+Shift+S', disabled: true,
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
          text: 'Undo', shortcut: 'Ctrl+Z', action: () => document.execCommand('undo'),
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
          text: 'Paste', shortcut: 'Ctrl+V', action: () => navigator.clipboard.readText().then(text => {
            this.textArea.focus()
            document.execCommand('insertText', false, text)
          }),
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

            this.dispatchEvent(launchEvent(() => {
              const about = this.spawnDialog(AppAbout)
              about.appName = 'Microsoft &reg; Notepad'
              about.appIcon = '/img/icons/notepad.ico'
              about.windowTitle = 'About Notepad'
              return about
            }, {
              size: {
                width: 419,
                height: 350,
              },
              disallowFlags: WindowRestriction.DisallowAll,
            }))
          },
        },
      ],
    },
  ]

  private noteTask = new Task(this, {
    task: async ([path], {signal}) => {
      if (!this.fileLinkNode) {
        return ''
      }

      const response = await fetch(path!.physicalPath, {signal})

      if (!response.ok) {
        const errorMessage = `Failed to load file: '${getLinkName(this.fileLinkNode)}'.`
        alertDialog(this, 'Error', errorMessage)
        return errorMessage
      }

      return await response.text()
    },
    args: () => [this.fileLinkNode],
  })

  handleFilePicked(file?: LinkNode): void {
    this.fileLinkNode = file
    let title = `Notepad - ${this.fileLinkNode ? getLinkName(this.fileLinkNode, false) : 'Untitled'}`
    this.dispatchEvent(windowPropertyChangeEvent({title}))
  }

  private calculatePosition(): void {
    const lines = this.textArea.value
      .substring(0, this.textArea.selectionStart)
      .split('\n')

    this.currentLine = lines.length
    this.currentColumn = lines[lines.length - 1].length + 1
  }

  render() {
    return this.noteTask.render({
      pending: () => html`
        <div class="app" @click="${this.handleClick}">
          <epk-toolbar id="toolbar" .toolbarSpec="${this.toolbarSpec}"></epk-toolbar>
          <div class="content">Loading...</div>
          <div class="status-bar">
            <p class="status-bar-field spacer"></p>
            <p class="status-bar-field">Ln 0, Col 0</p>
          </div>
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
        <div class="app" @click="${this.handleClick}">
          <epk-toolbar id="toolbar" .toolbarSpec="${this.toolbarSpec}"></epk-toolbar>
          <div class="content">Error</div>
          <div class="status-bar">
            <p class="status-bar-field spacer"></p>
            <p class="status-bar-field">Ln 0, Col 0</p>
          </div>
        </div>`,
    })
  }
}