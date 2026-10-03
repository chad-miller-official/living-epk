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