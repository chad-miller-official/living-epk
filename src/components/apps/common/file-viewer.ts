import {type FolderNode, getParentFolder, loadFolderNode} from "../../../lib/fs.ts";
import {Task} from "@lit/task";
import {alertDialog} from "../../../lib/os.ts";
import type {EpkAppConstructor} from "../../app.ts";

export const DEFAULT_WINDOW_ICON = '/img/icons/small/file-explorer-small.ico'

export function FileViewer<T extends EpkAppConstructor>(Base: T) {
  abstract class FileViewerMixin extends Base {
    protected folderNode?: FolderNode
    protected abstract path: string

    protected async loadIcons(path: string) {
      try {
        return await loadFolderNode(path)
      } catch (ex: unknown) {
        alertDialog(this, 'Address Bar', `Windows cannot find '${path}'. Check the spelling and try again.`)
        return null
      }
    }

    protected iconLoaderTask = new Task(this, {
      task: async ([src]) => this.onLoadIcons(src),
      args: () => [this.path]
    })

    abstract navigate(to: string): void

    protected async onLoadIcons(path: string): Promise<FolderNode> {
      const icons = await this.loadIcons(path)

      if (icons) {
        this.folderNode = icons
      }

      return this.folderNode!
    }

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