import type {EpkAppConstructor} from "../../../lib/support.ts";
import {activeWindowChangeEvent} from "../../../lib/events.ts";

export function Dialog<T extends EpkAppConstructor>(Base: T) {
  abstract class DialogMixin extends Base {
    delegatingAppId?: string

    close(event?: Event) {
      if (event) {
        event.preventDefault()
      }

      if (this.delegatingAppId) {
        this.dispatchEvent(activeWindowChangeEvent(this.delegatingAppId))
      }

      super.close(event)
    }
  }

  return DialogMixin
}