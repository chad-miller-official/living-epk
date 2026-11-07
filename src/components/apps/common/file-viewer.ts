import {EpkApp} from "../../app.ts";
import {property, query, queryAll, state} from "lit/decorators.js";
import {type FolderNode, getParentFolder, loadFolderNode} from "../../../lib/fs.ts";
import {alertDialog} from "../../../lib/os.ts";
import type {EpkIcon} from "../../icon.ts";
import {css} from "lit";
import {buttonStyle2} from "../../../lib/ui.ts";

/*
 * This class contains everything common to file-explorer.ts and file-picker.ts
 */
export abstract class FileViewer extends EpkApp {
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

    this.playClick().then(() => {
      this.folderNodeJsonPath = newPath
      this.pathStackIdx++

      if (newPath !== this.pathStack[this.pathStackIdx]) {
        this.pathStack.length = this.pathStackIdx
        this.pathStack.push(newPath)
      }
    })
  }

  canGoBack() {
    return this.pathStackIdx !== 0
  }

  canGoUp() {
    return getParentFolder(this.folderNode) !== ''
  }

  playClick() {
    return new Audio('/audio/click.wav').play()
  }

  goBack() {
    if (this.pathStackIdx > 0) {
      this.playClick().then(() => {
        this.pathStackIdx--
        this.folderNodeJsonPath = this.pathStack[this.pathStackIdx]
      })
    }
  }

  goUp() {
    const parentFolder = getParentFolder(this.folderNode)

    if (parentFolder) {
      this.navigate(parentFolder)
    }
  }

  handlePathInputSubmit(event: SubmitEvent) {
    event.preventDefault()
    this.navigate(this.pathInput.value)
  }
}