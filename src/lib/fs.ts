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