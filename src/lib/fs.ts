import {MediaIcon} from "../components/icons/media-icon.ts";
import {InternetExplorerIcon} from "../components/icons/internet-explorer-icon.ts";
import {GalleryIcon} from "../components/icons/gallery-icon.ts";
import {PlainTextIcon} from "../components/icons/plaintext-icon.ts";
import {EpkIcon} from "../components/icon.ts";
import {type DBSchema, type IDBPDatabase, openDB} from "idb";
import {FileExplorerIcon} from "../components/icons/file-explorer-icon.ts";
import {UnknownIcon} from "../components/icons/unknown-icon.ts";

export enum LinkNodeType {
  File = 'file', Folder = 'folder'
}

type FsMetadata = {
  alias?: string,
  icon?: {
    small?: string,
    large?: string,
  },
  timestamp?: number,
}

export type LinkNode = {
  type: LinkNodeType,
  physicalPath: string,
  logicalPath: string,
  $?: FsMetadata,
}

export type FolderNode = {
  path: string
  $?: FsMetadata,
  folderLinks: LinkNode[],
  fileLinks: LinkNode[],
}

export class FsError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
  }
}

type FsRecord = {
  path: string,
  $?: FsMetadata,
  files: string | null,
  folders: Pick<FsRecord, 'path' | '$'>[],
}

type FsStruct = {
  $?: FsMetadata,
  '.'?: string,
} & { [dir: string]: FsStruct }

interface IdbSchema extends DBSchema {
  'file-system': {
    key: string,
    value: FsRecord,
  }
}

let _idb: IDBPDatabase<IdbSchema>

function _loadFoldersHelper(prefix: string, cwd: string, fsStruct: FsStruct): FsRecord[] {
  const folders = Object.keys(fsStruct)
    .filter(f => f !== '.' && f !== '$')
    .map(f => {
      return {
        path: f,
        $: fsStruct[f].$
      }
    })

  const record: FsRecord = {
    path: `${prefix}${cwd}`,
    $: fsStruct.$ || {},
    files: fsStruct['.'] || null,
    folders,
  }

  return [
    record,
    ...record.folders.map(m => _loadFoldersHelper(`${record.path}\\`, m.path, fsStruct[m.path])).flat()
  ]
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

export async function loadFolderNode(path: string, signal?: AbortSignal): Promise<FolderNode> {
  path = path.replace(/\\?$/, '')
  const record = await _idb.get('file-system', path)

  if (!record) {
    throw new FsError(`Failed to load file system record: ${path}`)
  }

  let folderLinks: LinkNode[] = []
  const folders = record.folders

  if (folders) {
    folderLinks = record.folders
      .sort((a, b) => a.path.localeCompare(b.path))
      .map(folder => {
        const fullPath = `${path}\\${folder.path}`

        return {
          type: LinkNodeType.Folder,
          physicalPath: fullPath,
          logicalPath: fullPath,
          $: folder.$,
        }
      })
  }

  let fileLinks: LinkNode[] = []
  const filesJson = record.files

  if (filesJson) {
    const filesResponse = await fetch(filesJson, {signal})

    if (!filesResponse.ok) {
      throw new FsError(`Failed to load files data: ${record.files}`)
    }

    type ProtoLinkNode = {
      path: string,
      $: FsMetadata,
    }

    const filesResponseJson = await filesResponse.json()
    const protoNodes = filesResponseJson.paths as ProtoLinkNode[]

    fileLinks = protoNodes
      .sort((a, b) => a.path.localeCompare(b.path))
      .map(n => {
        return {
          type: LinkNodeType.File,
          physicalPath: n.path,
          logicalPath: `${path}\\${n.path.split('/').pop()}`,
          $: n.$,
        }
      })
  }

  return {
    path,
    $: record.$,
    folderLinks,
    fileLinks,
  }
}

export function getLinkName(linkNode: LinkNode, withExtension = true) {
  let fileName

  if (linkNode.type === LinkNodeType.File) {
    fileName = linkNode.physicalPath.split('/').pop() || ''

    if (!withExtension) {
      fileName = fileName?.replace(/\.[^.]+$/, '')
    }
  } else {
    fileName = linkNode.physicalPath.split('\\').pop() || ''
  }

  return fileName
}

export function getFileExtension(linkNode: LinkNode) {
  return linkNode.physicalPath.split('.').pop()
}

const _dateTimeFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
  timeStyle: 'short',
})

export function getFormattedTimestamp(linkNode: LinkNode) {
  return _dateTimeFormat.format(linkNode.$?.timestamp)
}

export function getParentFolder(folderNode: FolderNode) {
  const parentPathParts = folderNode.path.split('\\')
  parentPathParts.pop()
  return parentPathParts.join('\\')
}

export function linkNodeToIcon(linkNode: LinkNode) {
  const title = getLinkName(linkNode)
  let icon: EpkIcon

  if (linkNode.type === LinkNodeType.File) {
    const extension = getFileExtension(linkNode)

    switch (extension) {
      case 'wav':
      case 'mp3':
        icon = new MediaIcon()
        icon.icon = '/img/icons/audio.ico'
        break
      case 'mp4':
      case 'webm':
        icon = new MediaIcon()
        icon.icon = '/img/icons/video.ico'
        break
      case 'html':
        icon = new InternetExplorerIcon()
        break
      case 'jpg':
        icon = new GalleryIcon()
        break
      case 'txt':
        icon = new PlainTextIcon()
        break
      default:
        icon = new UnknownIcon()
    }
  } else {
    icon = new FileExplorerIcon()
  }

  icon.title = title
  icon.fileLinkNode = linkNode

  if (linkNode.$?.icon?.large) {
    icon.icon = linkNode.$.icon.large
  }

  icon.classList.add('epk-icon')
  return icon
}