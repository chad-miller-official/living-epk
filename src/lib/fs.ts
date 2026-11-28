import {MediaIcon} from "../components/icons/media-icon.ts";
import {InternetExplorerIcon} from "../components/icons/internet-explorer-icon.ts";
import {GalleryIcon} from "../components/icons/gallery-icon.ts";
import {PlainTextIcon} from "../components/icons/plaintext-icon.ts";
import {EpkIcon, type IconGraphic} from "../components/icon.ts";
import {type DBSchema, type IDBPDatabase, openDB} from "idb";
import {FileExplorerIcon} from "../components/icons/file-explorer-icon.ts";
import {UnknownIcon} from "../components/icons/unknown-icon.ts";

export enum LinkNodeType {
  File = 'file',
  Folder = 'folder',
}

export type LinkNode = {
  type: LinkNodeType,
  physicalPath: string,
  logicalPath: string,
  metadata?: FsMetadata,
}

export type FolderNode = {
  path: string,
  links: LinkNode[],
  metadata?: FsMetadata,
}

type FsMetadata = {
  alias?: string,
  icon?: Partial<IconGraphic>,
  timestamp?: number,
}

type FsRecord = {
  path: string,
  filesJson?: string,
  folders: Pick<FsRecord, 'path' | 'metadata'>[],
  metadata?: FsMetadata,
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

let idb: IDBPDatabase<IdbSchema>

function loadFoldersHelper(prefix: string, cwd: string, fsStruct: FsStruct): FsRecord[] {
  const folders = Object.keys(fsStruct)
    .filter(f => !f.match(/^[.$]$/))
    .map(f => ({
      path: f,
      metadata: fsStruct[f].$
    }))

  const record: FsRecord = {
    path: `${prefix}${cwd}`,
    metadata: fsStruct.$,
    filesJson: fsStruct['.'],
    folders,
  }

  const additionalRecords = record.folders
    .map(m => loadFoldersHelper(`${record.path}\\`, m.path, fsStruct[m.path]))
    .flat()

  return [record, ...additionalRecords]
}

async function loadFolders() {
  const response = await fetch("/data/_folders.json")
  const folders = await response.json()
  const root = Object.keys(folders)[0]
  return loadFoldersHelper('', root, folders[root])
}

export async function initDb() {
  if (idb) {
    return
  }

  idb = await openDB<IdbSchema>('chad-db', 1, {
    async upgrade(db) {
      db.createObjectStore('file-system', {keyPath: 'path'})
    }
  })

  const records = await loadFolders()
  const tx = idb.transaction('file-system', 'readwrite')

  await Promise.all([
    ...records.map(record => tx.store.put(record)),
    tx.done
  ])
}

export async function loadFolderNode(path: string, signal?: AbortSignal): Promise<FolderNode> {
  path = path.replace(/\\?$/, '')
  const record = await idb.get('file-system', path)

  if (!record) {
    throw new Error(`Failed to load file system record: ${path}`)
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
          metadata: folder.metadata,
        }
      })
  }

  let fileLinks: LinkNode[] = []
  const filesJson = record.filesJson

  if (filesJson) {
    const filesResponse = await fetch(filesJson, {signal})

    if (!filesResponse.ok) {
      throw new Error(`Failed to load files data: ${record.filesJson}`)
    }

    const filesResponseJson = await filesResponse.json()
    const protoNodes = filesResponseJson.paths as Pick<FsRecord, 'path' | 'metadata'>[]

    fileLinks = protoNodes
      .sort((a, b) => a.path.localeCompare(b.path))
      .map(n => {
        return {
          type: LinkNodeType.File,
          physicalPath: n.path,
          logicalPath: `${path}\\${n.path.split('/').pop()}`,
          metadata: n.metadata,
        }
      })
  }

  return {
    path,
    metadata: record.metadata,
    links: [...folderLinks, ...fileLinks],
  }
}

export function getLinkName(linkNode: LinkNode, withExtension = true): string {
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

export function getFileExtension(linkNode: LinkNode): string {
  return linkNode.physicalPath.split('.').pop() || ''
}

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
  timeStyle: 'short',
})

export function getFormattedTimestamp(linkNode: LinkNode): string {
  return DATE_TIME_FORMAT.format(linkNode.metadata?.timestamp)
}

export function getParentFolderName(folderNode: FolderNode): string {
  const parentPathParts = folderNode.path.split('\\')
  parentPathParts.pop()
  return parentPathParts.join('\\')
}

export function getFileLinkNodes(folderNode: FolderNode): LinkNode[] {
  return folderNode.links.filter(f => f.type === LinkNodeType.File)
}

export function getFolderLinkNodes(folderNode: FolderNode): LinkNode[] {
  return folderNode.links.filter(f => f.type === LinkNodeType.Folder)
}

export function linkNodeToIcon(linkNode: LinkNode): EpkIcon {
  const title = getLinkName(linkNode)
  let icon: EpkIcon

  if (linkNode.type === LinkNodeType.File) {
    const extension = getFileExtension(linkNode)

    switch (extension) {
      case 'wav':
      case 'mp3':
        icon = new MediaIcon()

        icon.icon = {
          small: '/img/icons/audio.ico',
          large: '/img/icons/audio.ico',
        }

        break
      case 'mp4':
      case 'webm':
        icon = new MediaIcon()

        icon.icon = {
          small: '/img/icons/video.ico',
          large: '/img/icons/video.ico',
        }

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

  icon.fileLinkNode = linkNode

  if (linkNode.metadata?.icon) {
    icon.icon = {
      small: linkNode.metadata.icon.small || icon.icon.small,
      large: linkNode.metadata.icon.large || icon.icon.large,
    }
  }

  icon.innerText = title
  icon.classList.add('epk-icon')

  return icon
}