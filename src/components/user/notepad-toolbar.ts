import {customElement} from "lit/decorators.js";
import {EpkToolbar} from "../toolbar.ts";
import {type ToolbarItem, ToolbarUiElement} from "../../lib/toolbar.ts";

@customElement('notepad-toolbar')
export class NotepadToolbar extends EpkToolbar {
  getToolbarSpec(): ToolbarItem[] {
    return [
      {
        text: 'File',
        items: [
          {
            text: 'New',
            shortcut: 'Ctrl+N',
            action: () => {},
          },
          {
            text: 'New Window',
            shortcut: 'Ctrl+Shift+N',
            action: () => {},
          },
          {
            text: 'Open',
            shortcut: 'Ctrl+O',
            action: () => {},
          },
          {
            text: 'Save',
            shortcut: 'Ctrl+S',
            action: () => {},
          },
          {
            text: 'Save As...',
            shortcut: 'Ctrl+Shift+S',
            action: () => {},
          },
          ToolbarUiElement.DIVIDER,
          {
            text: 'Page Setup...',
            action: () => {},
          },
          {
            text: 'Print...',
            shortcut: 'Ctrl+P',
            action: () => {},
          },
          ToolbarUiElement.DIVIDER,
          {
            text: 'Exit',
            action: () => {},
          },
        ]
      }
    ]
  }
}