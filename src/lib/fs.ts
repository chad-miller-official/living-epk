import {MusicIcon} from "../components/icons/music-icon.ts";
import {MarkdownIcon} from "../components/icons/markdown-icon.ts";
import {GalleryIcon} from "../components/icons/gallery-icon.ts";
import {PlainTextIcon} from "../components/icons/plaintext-icon.ts";
import {EpkIcon} from "../components/icon.ts";
import {type DBSchema, type IDBPDatabase, openDB} from "idb";
import {FileExplorerIcon} from "../components/icons/file-explorer-icon.ts";


export enum LinkNodeType {
  File = 'file', Folder = 'folder'
}

export type LinkNode = {
  type: LinkNodeType
  path: string
  timestamp?: number
}

export type FolderNode = {
  path: string
  folderLinks: LinkNode[]
  fileLinks: LinkNode[]
}

export class FsError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
  }
}

type FsRecord = {
  path: string,
  files: string | null,
  folders: string[],
}

interface IdbSchema extends DBSchema {
  'file-system': {
    key: string,
    value: FsRecord,
  }
}

let _idb: IDBPDatabase<IdbSchema>
type _FolderStructure = { [dir: string]: string }

function _loadFoldersHelper(prefix: string, cwd: string, fsStruct: _FolderStructure | string): FsRecord[] {
  const record: FsRecord = {
    path: `${prefix}${cwd}`,
    files: null,
    folders: [],
  }

  if (typeof fsStruct === 'string') {
    record.files = fsStruct
    return [record]
  } else {
    record.files = fsStruct['.']
    record.folders = Object.keys(fsStruct).filter(f => f !== '.')

    return [
      record,
      ...record.folders.map(m => _loadFoldersHelper(`${record.path}\\`, m, fsStruct[m])).flat()
    ]
  }
}

async function _loadFolders() {
  const response = await fetch("/data/_folders.json")
  const folders = await response.json()
  const root = Object.keys(folders)[0]
  return _loadFoldersHelper('', root, folders[root])
}

export async function initDb() {
  if (_idb) {
    return
  }

  _idb = await openDB<IdbSchema>('chad-db', 1, {
    async upgrade(db) {
      db.createObjectStore('file-system', {
        keyPath: 'path',
      })
    }
  })

  const records = await _loadFolders()
  const tx = _idb.transaction('file-system', 'readwrite')

  await Promise.all([
    ...records.map(record => tx.store.put(record)),
    tx.done
  ])
}

export async function loadFolderNode(path: string, signal: AbortSignal): Promise<FolderNode> {
  path = path.replace(/\\?$/, '')
  const record = await _idb.get('file-system', path)

  if (!record) {
    throw new FsError(`Failed to load file system record: ${path}`)
  }

  let folderLinks: LinkNode[] = []
  const folders = record.folders

  if (folders) {
    folderLinks = folders.map(folder => ({
      type: LinkNodeType.Folder,
      path: `${path}\\${folder}`
    }))

    folderLinks.sort((a, b) => a.path.localeCompare(b.path))
  }

  let fileLinks: LinkNode[] = []
  const filesJson = record.files

  if (filesJson) {
    const filesResponse = await fetch(filesJson, {signal})

    if (!filesResponse.ok) {
      throw new FsError(`Failed to load files data: ${record.files}`)
    }

    fileLinks = (await filesResponse.json())['paths'] as LinkNode[]
    fileLinks.sort((a, b) => a.path.localeCompare(b.path))
    fileLinks.forEach(linkNode => linkNode.type = LinkNodeType.File)
  }

  return {
    path,
    folderLinks,
    fileLinks,
  }
}

export function getLinkName(linkNode: LinkNode, withExtension = true) {
  let fileName

  if (linkNode.type === LinkNodeType.File) {
    fileName = linkNode.path.split('/').pop() || ''

    if (!withExtension) {
      fileName = fileName?.split(/\.(?=[^.]+$)/)[0]
    }
  } else {
    fileName = linkNode.path.split('\\').pop() || ''
  }

  return fileName
}

export function getFileExtension(linkNode: LinkNode) {
  return linkNode.path.split('.').pop()
}

const _dateTimeFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
  timeStyle: 'short',
})

export function getFormattedTimestamp(linkNode: LinkNode) {
  return _dateTimeFormat.format(linkNode.timestamp)
}

export function linkNodeToIcon(linkNode: LinkNode) {
  let icon: EpkIcon

  if (linkNode.type === LinkNodeType.File) {
    const extension = getFileExtension(linkNode)

    switch (extension) {
      case 'wav':
        icon = new MusicIcon()
        break
      case 'md':
        icon = new MarkdownIcon()
        break
      case 'jpg':
        icon = new GalleryIcon()
        break
      case 'txt':
        icon = new PlainTextIcon()
        break
      default:
        // TODO this should raise an alert box
        throw new Error(`Unhandled extension: ${extension}`)
    }
  } else {
    icon = new FileExplorerIcon()
  }

  icon.title = getLinkName(linkNode)
  icon.fileLinkNode = linkNode
  icon.classList.add('epk-icon')

  return icon
}