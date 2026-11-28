export class PathStack<T> {
  private stack: T[] = []
  private idx: number = 0

  push(item: T, noInc = false): void {
    if (!noInc) {
      this.idx++
    }

    this.stack.push(item)
  }

  removeMostRecent(): void {
    this.idx--
    this.stack.pop()
  }

  canGoBack(): boolean {
    return this.idx > 0
  }

  canGoForward(): boolean {
    return this.idx < this.stack.length - 1
  }

  goBack(): T {
    this.idx--
    return this.stack[this.idx]
  }

  goForward(): T {
    this.idx++
    return this.stack[this.idx]
  }
}