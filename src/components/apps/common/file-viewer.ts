import {type FolderNode, getParentFolder, loadFolderNode} from "../../../lib/fs.ts";
import {Task} from "@lit/task";
import {alertDialog} from "../../../lib/os.ts";
import type {EpkApp} from "../../app.ts";

type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T;
type EpkAppConstructor = AbstractConstructor<EpkApp>

export function FileViewer<T extends EpkAppConstructor>(Base: T) {
  abstract class FileViewerMixin extends Base {
    protected folderNode?: FolderNode
    protected abstract path: any

    protected async loadIcons(path: string) {
      try {
        return await loadFolderNode(path)
      } catch (ex: unknown) {
        alertDialog(this, 'Address Bar', `Windows cannot find '${path}'. Check the spelling and try again.`)
      }

      return {path: '', folderLinks: [], fileLinks: []}
    }

    protected iconLoaderTask = new Task(this, {
      task: async ([src]) => (this.folderNode = await this.loadIcons(src))!,
      args: () => [this.path]
    })

    abstract navigate(to: string): void

    canGoUp() {
      return this.folderNode && getParentFolder(this.folderNode) !== ''
    }

    goUp() {
      if (!this.folderNode) {
        return
      }

      const parentFolder = getParentFolder(this.folderNode)

      if (parentFolder) {
        this.navigate(parentFolder)
      }
    }
  }

  return FileViewerMixin
}