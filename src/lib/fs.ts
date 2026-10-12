import {MusicIcon} from "../components/icons/music-icon.ts";
import {MarkdownIcon} from "../components/icons/markdown-icon.ts";
import {GalleryIcon} from "../components/icons/gallery-icon.ts";
import {PlainTextIcon} from "../components/icons/plaintext-icon.ts";
import {EpkIcon} from "../components/icon.ts";

export type FsPath = {
  path: string,
  displayPath: string,
  timestamp: number,
}

export type FsSpec = {
  displayRoot: string,
  paths: FsPath[],
}

export class FsError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
  }
}

export async function loadFsSpec(fsSpecFile: string, signal?: AbortSignal): Promise<FsSpec> {
  const response = await fetch(fsSpecFile, {signal})

  if (!response.ok) {
    throw new FsError(`Failed to load file system chunk: ${fsSpecFile}`)
  }

  const fsSpec = await response.json() as FsSpec
  fsSpec.paths.sort((a, b) => a.displayPath.localeCompare(b.displayPath))

  return fsSpec
}

export function getFileExtension(path: string) {
  return path.split('.').pop()
}

export function getFileName(path: string, withExtension = true) {
  let fileName = path.split('/').pop() || ''

  if (!withExtension) {
    fileName = fileName?.split(/\.(?=[^.]+$)/)[0]
  }

  return fileName
}

export function buildIcon(path: FsPath) {
  const extension = getFileExtension(path.path)
  let icon: EpkIcon

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

  icon.title = path.displayPath
  icon.filePath = path.path
  icon.classList.add('epk-icon')

  return icon
}