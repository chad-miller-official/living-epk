import {customElement} from "lit/decorators.js";
import {EpkToolbar} from "../toolbar.ts";
import {type ToolbarMenu} from "../../lib/toolbar.ts";

@customElement('file-explorer-toolbar')
export class FileExplorerToolbar extends EpkToolbar {
  getToolbarSpec(): ToolbarMenu[] {
    return [
      {
        text: 'File',
        items: [],
      },
      {
        text: 'Edit',
        items: [],
      },
      {
        text: 'View',
        items: [],
      },
      {
        text: 'Favorites',
        items: [],
      },
      {
        text: 'Tools',
        items: [],
      },
      {
        text: 'Help',
        items: [],
      }
    ]
  }
}