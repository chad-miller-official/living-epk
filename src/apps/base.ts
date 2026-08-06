export abstract class EpkApp {
  abstract windowTitle: string
  abstract windowIcon: string

  abstract getWindowContents(): HTMLElement[]

  getToolbarItems(): HTMLLIElement[] {
    return []
  }

  getStatusBarItems(): HTMLParagraphElement[] {
    return []
  }

  /**
   * Returns a tuple in the form of [width, height], both in pixels.
   */
  getMinimumDimensions(): [number | null, number | null] {
    return [256, 256]
  }
}