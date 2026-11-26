import {activeWindowChangeEvent} from "../../../lib/events.ts";
import type {EpkAppConstructor} from "../../app.ts";

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