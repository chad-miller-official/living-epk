import {MusicIcon} from "../components/icons/music-icon.ts";
import {MarkdownIcon} from "../components/icons/markdown-icon.ts";
import {GalleryIcon} from "../components/icons/gallery-icon.ts";
import {PlainTextIcon} from "../components/icons/plaintext-icon.ts";
import {EpkIcon} from "../components/icon.ts";
import {FileExplorerIcon} from "../components/icons/file-explorer-icon.ts";
import {type DBSchema, type IDBPDatabase, openDB} from "idb";

interface IdbSchema extends DBSchema {
  'file-system': {
    key: string,
    value: RecordType,
  }
}

let _idb: IDBPDatabase<IdbSchema>

export async function initDb() {
  _idb = await openDB<IdbSchema>('chad-db', 1, {
    upgrade(db) {
      db.createObjectStore('file-system', {
        keyPath: 'path',
      })

      const tx = db.transaction('file-system', 'readwrite')

      await Promise.all([
        ...loadFolders(),
        tx.done
      ])

      loadFolders().then(records => {
        records.forEach(record => tx.store.put(record))
      })
    }
  })
}

function loadFoldersHelper(prefix: string, cwd: string, body: BodyType): RecordType[] {
  const record: RecordType = {
    path: `${prefix}${cwd}`,
    files: null,
    folders: [],
  }

  if (typeof body === 'string') {
    record.files = body
    return [record]
  } else {
    record.files = body['.']
    record.folders = Object.keys(body).filter(f => f !== '.')

    return [
      record,
      ...record.folders.map(m => loadFoldersHelper(`${record.path}\\`, m, body[m])).flat()
    ]
  }
}

async function loadFolders() {
  const response = await fetch("/data/_folders.json")
  const folders = await response.json()
  const root = Object.keys(folders)[0]
  return loadFoldersHelper('', root, folders[root])
}

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
  timeStyle: 'short',
})

export type FsPath = {
  path: string
  displayPath?: string
  timestamp?: number
}

export type FsSpec = {
  displayRoot: string,
  parent?: string,
  paths: FsPath[],
}

export function getFileName(path: FsPath, withExtension = true) {
  let fileName = path.displayPath || path.path.split('/').pop() || ''

  if (!withExtension) {
    fileName = fileName?.split(/\.(?=[^.]+$)/)[0]
  }

  return fileName
}

export function getFileExtension(path: FsPath) {
  return path.path.split('.').pop()
}

export function getFormattedTimestamp(path: FsPath) {
  return DATE_TIME_FORMAT.format(path.timestamp)
}

export class FsError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
  }
}

type BodyType = {
  [dir: string]: string,
} | string

type RecordType = {
  path: string,
  files: string | null,
  folders: string[],
}

export async function loadFsSpec(fsSpecFile: string, signal?: AbortSignal): Promise<FsSpec> {
  const response = await fetch(fsSpecFile, {signal})

  if (!response.ok) {
    throw new FsError(`Failed to load file system chunk: ${fsSpecFile}`)
  }

  const fsSpec = await response.json() as FsSpec
  fsSpec.paths.sort((a, b) => a.path.localeCompare(b.path))

  return fsSpec
}

export function buildIcon(path: FsPath) {
  const extension = getFileExtension(path)
  let icon: EpkIcon

  switch (extension) {
    case 'json':
      icon = new FileExplorerIcon()
      break
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

  icon.title = getFileName(path)
  icon.filePath = path
  icon.classList.add('epk-icon')

  return icon
}