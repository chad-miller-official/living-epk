import {customElement, property, query, state} from "lit/decorators.js";
import {css, html, nothing} from "lit";
import {EpkToolbar} from "../ui.ts";
import {type ToolbarMenu, ToolbarUiElement} from "../../lib/toolbar.ts";
import {Task} from "@lit/task";
import {EpkApp} from "../app.ts";
import dayjs from "dayjs";
import {closeEvent, DISALLOW_ALL, launchEvent} from "../../lib/events.ts";

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
  windowTitle = 'Notepad'

  @property({type: String})
  windowIcon = '/img/notepad-small.ico'

  @property({type: Number})
  currentLine = 1

  @property({type: Number})
  currentColumn = 1

  @query('#toolbar')
  toolbar!: EpkToolbar

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
          text: 'Open', shortcut: 'Ctrl+O', action: () => {
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
          text: 'Exit', action: () => this.dispatchEvent(closeEvent(this)),
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
            this.toolbar.closeAll()

            this.dispatchEvent(launchEvent(() => new Promise<NotepadAbout>(resolve => resolve(new NotepadAbout())), {
              width: 419,
              height: 400,
              disallowFlags: DISALLOW_ALL,
            }))
          },
        },
      ],
    },
  ]

  filePath: string | undefined

  private noteTask = new Task(this, {
    task: async ([path], {signal}) => {
      if (!this.filePath) {
        return ''
      }

      const response = await fetch(path!!, {signal})

      if (!response.ok) {
        alert('Error') // TODO XXX FIXME
      }

      return await response.text()
    },
    args: () => [this.filePath],
  })

  handleClick(event: Event) {
    if (event.target !== this.toolbar) {
      this.toolbar.closeAll()
    }
  }

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
          <epk-toolbar id="toolbar" class="toolbar"
                       .toolbarSpec="${this.toolbarSpec}"></epk-toolbar>
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

@customElement('notepad-about')
export class NotepadAbout extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    css`
      .about {
        display: flex;
        flex-direction: column;
        font-family: "Pixelated MS Sans Serif", Arial;
        height: 100%;
      }

      .about-text {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .about-wrapper {
        align-items: flex-start;
        display: flex;
        gap: 8px;
        height: 100%;
        padding: 14px;

        .upper {
          height: 70%;
        }

        .lower {
          align-items: flex-start;
          height: 30%;
        }

        .upper, .lower {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        p {
          margin: 0 0 6px 0;
        }
      }

      .eula {
        color: #082ea2;
        cursor: pointer;
        text-decoration: underline;
      }

      .eula-user {
        margin: 10px 0 18px 14px;
      }

      .memory {
        width: 100%;
      }

      button {
        align-self: flex-end;
      }

      hr {
        width: 100%;
      }
    `
  ]

  windowTitle = 'About Notepad'
  windowIcon = null

  handleEulaClick(event: Event) {
    event.stopPropagation()

    this.dispatchEvent(launchEvent(() => new Promise<Notepad>(resolve => {
      const notepad = new Notepad()
      notepad.windowTitle = `Notepad - eula`
      notepad.filePath = '/fs/plaintext/eula.txt'
      resolve(notepad)
    })))
  }

  requestClose() {
    this.dispatchEvent(closeEvent(this))
  }

  render() {
    return html`
      <div class="app">
        <div class="content">
          <div class="about">
            <img src="/img/banner.png" width="413" alt="Banner"/>
            <div class="about-wrapper">
              <img src="/img/notepad.ico" alt="Notepad"/>
              <div class="about-text">
                <div class="upper">
                  <div>
                    <p>Microsoft &reg; Notepad</p>
                    <p>Version 5.1 (Build 2600.xpsp.080413-2111 : Service Pack 3)</p>
                    <p>Copyright &copy; 2007 Microsoft Corporation</p>
                  </div>
                  <div>
                    <p>
                      This product is licensed under the terms of the
                      <span class="eula"
                            @click="${this.handleEulaClick}">End-User License Agreement</span>
                      to:
                    </p>
                    <p class="eula-user">chad</p>
                  </div>
                </div>
                <div class="lower">
                  <div class="memory">
                    <hr/>
                    <div>
                      Physical memory available to Windows:
                      <span class="memory">196,080 KB</span>
                    </div>
                  </div>
                  <button @click="${this.requestClose}">OK</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`
  }
}