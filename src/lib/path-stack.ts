export class PathStack<T> {
  private stack: T[] = []
  private idx = 0

  push(item: T, noInc = false) {
    if (!noInc) {
      this.idx++
    }

    this.stack.push(item)
  }

  pop() {
    this.idx--
    return this.stack.pop()
  }

  canGoBack() {
    return this.idx > 0
  }

  canGoForward() {
    return this.idx < this.stack.length - 1
  }

  goBack() {
    this.idx--
    return this.stack[this.idx]
  }

  goForward() {
    this.idx++
    return this.stack[this.idx]
  }
}