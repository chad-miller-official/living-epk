import {customElement, property, query} from "lit/decorators.js";
import {css, html} from "lit";
import {EpkToolbar} from "../ui.ts";
import {type ToolbarMenu, ToolbarUiElement} from "../../lib/toolbar.ts";
import {Task} from "@lit/task";
import {EpkApp} from "../app.ts";

@customElement('notepad-app')
export class Notepad extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    css`
      #notepad {
        font-family: monospace;
        font-size: 12pt;
        resize: none;
      }
    `
  ]

  @property({type: String})
  windowTitle = 'Notepad'

  @property({type: String})
  windowIcon = '/img/513.ico'

  @property({type: Number})
  currentLine = 1

  @property({type: Number})
  currentColumn = 1

  @query('#toolbar')
  toolbar!: EpkToolbar

  @query('#notepad')
  textArea!: HTMLTextAreaElement

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
          text: 'Save', shortcut: 'Ctrl+S', action: () => {
          },
        },
        {
          text: 'Save As...', shortcut: 'Ctrl+Shift+S', action: () => {
          },
        },
        ToolbarUiElement.DIVIDER,
        {
          text: 'Page Setup...', action: () => {
          },
        },
        {
          text: 'Print...', shortcut: 'Ctrl+P', action: () => {
          },
        },
        ToolbarUiElement.DIVIDER,
        {
          text: 'Exit', action: () => {
          },
        },
      ]
    },
    {
      text: 'Edit',
      items: [
        {
          text: 'Undo', shortcut: 'Ctrl+Z', action: () => {
          },
        },
        {
          text: 'Cut', shortcut: 'Ctrl+X', action: () => {
          },
        },
        {
          text: 'Copy', shortcut: 'Ctrl+C', action: () => {
          },
        },
        {
          text: 'Paste', shortcut: 'Ctrl+V', action: () => {
          },
        },
        {
          text: 'Delete', shortcut: 'Del', action: () => {
          },
        },
        ToolbarUiElement.DIVIDER,
        {
          text: 'Find', shortcut: 'Ctrl+F', action: () => {
          },
        },
        {
          text: 'Find Next', shortcut: 'F3', action: () => {
          },
        },
        {
          text: 'Replace...', shortcut: 'Ctrl+H', action: () => {
          },
        },
        {
          text: 'Go To...', shortcut: 'Ctrl+G', action: () => {
          },
        },
        ToolbarUiElement.DIVIDER,
        {
          text: 'Select All', shortcut: 'Ctrl+A', action: () => {
          },
        },
        {
          text: 'Time/Date', shortcut: 'F5', action: () => {
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
          <epk-toolbar id="toolbar" class="toolbar" .toolbarSpec="${this.toolbarSpec}"></epk-toolbar>
          <textarea id="notepad" class="content" wrap="off" .value="${textValue}" @click="${this.calculatePosition}"
                    @keyup="${this.calculatePosition}"></textarea>
          <div class="status-bar">
            <p class="status-bar-field spacer"></p>
            <p class="status-bar-field">Ln ${this.currentLine}, Col ${this.currentColumn}</p>
          </div>
        </div>`,
      error: () => html`
        <div class="app">
          <div class="content">Error</div>
        </div>`,
    })
  }
}