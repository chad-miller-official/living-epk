import {customElement} from "lit/decorators.js";
import {EpkToolbar} from "../toolbar.ts";
import {type ToolbarMenu, ToolbarUiElement} from "../../lib/toolbar.ts";

@customElement('notepad-toolbar')
export class NotepadToolbar extends EpkToolbar {
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