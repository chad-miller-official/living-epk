import {customElement} from "lit/decorators.js";
import {EpkToolbar} from "../toolbar.ts";
import {type ToolbarItem, ToolbarUiElement} from "../../lib/toolbar.ts";

@customElement('file-explorer-toolbar')
export class FileExplorerToolbar extends EpkToolbar {
  getToolbarSpec(): ToolbarItem[] {
    return [
      {
        text: 'File',
        items: [
          {
            text: 'Open',
            shortcut: 'Ctrl+O',
            action: () => {
              alert('Hi lol')
            },
          },
          {
            text: 'Schwongle',
            shortcut: 'Ctrl+Q',
            action: () => {
              alert('glub')
            },
          },
          ToolbarUiElement.DIVIDER,
          {
            text: 'Exit',
            action: () => {
              alert('Close')
            }
          }
        ],
      },
      {
        text: 'Edit',
        items: [
          {
            text: 'Thingy',
            action: () => {
              alert('fgsfds')
            },
          },
        ],
      },
      {
        text: 'View',
        items: [],
      },
      {
        text: 'Help',
        items: [],
      }
    ]
  }
}