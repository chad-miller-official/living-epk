import {MusicIcon} from "../components/icons/music-icon.ts";
import {MarkdownIcon} from "../components/icons/markdown-icon.ts";
import {GalleryIcon} from "../components/icons/gallery-icon.ts";
import {PlainTextIcon} from "../components/icons/plaintext-icon.ts";
import {EpkIcon} from "../components/icon.ts";
import {FileExplorerIcon} from "../components/icons/file-explorer-icon.ts";

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

function loadFoldersHelper(prefix: string, cwd: string, spec: object | string): object[] {
  const record = {
    id: `${prefix}${cwd}`,
    path: null,
    members: null,
  }

  if (typeof spec === 'string') {
    record.path = spec
    return [record]
  } else {
    record.path = spec['.']
    record.members = Object.keys(spec).filter(f => f !== '.')

    return [
      record,
      ...record.members.map(m => loadFoldersHelper(`${record.id}\\`, m, spec[m])).flat()
    ]
  }
}

export async function loadFolders() {
  const response = await fetch("/data/_folders.json")
  const folders = await response.json()
  const root = Object.keys(folders)[0]
  return loadFoldersHelper('', root, folders[root])
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