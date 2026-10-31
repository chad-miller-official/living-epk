import {EpkApp} from "../app.ts";
import {buttonStyle2} from "../ui.ts";
import {property, query, queryAll, state} from "lit/decorators.js";
import {type FolderNode, loadFolderNode} from "../../lib/fs.ts";
import {alertDialog} from "../../lib/os.ts";
import type {EpkIcon} from "../icon.ts";
import {css} from "lit";

/*
 * This class contains everything common to file-explorer.ts and file-picker.ts
 */
export abstract class BaseFileViewer extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    buttonStyle2,
    css`
      #pathInput {
        flex-grow: 1;
      }
    `
  ]

  @query('#pathInput')
  pathInput!: HTMLInputElement

  @queryAll('.epk-icon')
  icons!: EpkIcon[]

  @property({type: String})
  folderNodeJsonPath!: string

  @state()
  folderNode: FolderNode = {path: '', folderLinks: [], fileLinks: []}

  pathStack: string[] = []
  pathStackIdx = 0

  protected async loadIcons(path: string) {
    try {
      return await loadFolderNode(path)
    } catch (ex: unknown) {
      alertDialog(this, 'Address Bar', `Windows cannot find '${path}'. Check the spelling and try again.`)
    }

    return null
  }

  connectedCallback() {
    super.connectedCallback()
    this.pathStack.push(this.folderNodeJsonPath)
  }

  handleClick(event: Event) {
    super.handleClick(event)
    Array.from(this.icons).filter(i => i !== event.target).forEach(i => i.selected = false)
  }

  navigate(newPath: string) {
    if (this.folderNodeJsonPath.replace(/\\?$/, '') === newPath.replace(/\\?$/, '')) {
      return
    }

    this.folderNodeJsonPath = newPath
    this.pathStackIdx++

    if (newPath !== this.pathStack[this.pathStackIdx]) {
      this.pathStack.length = this.pathStackIdx
      this.pathStack.push(newPath)
    }
  }

  goBack() {
    if (this.pathStackIdx > 0) {
      this.pathStackIdx--
      this.folderNodeJsonPath = this.pathStack[this.pathStackIdx]
    }
  }

  handlePathInputSubmit(event: SubmitEvent) {
    event.preventDefault()
    this.navigate(this.pathInput.value)
  }
}