import {activeWindowChangeEvent} from "../../../lib/events.ts";
import {type EpkAppConstructor} from "../../app.ts";

export type EpkDialog<T> = {
  delegatingAppId: string
} & T

export function Dialog<T extends EpkAppConstructor>(Base: T) {
  abstract class DialogMixin extends Base {
    delegatingAppId!: string

    close(event?: Event) {
      if (event) {
        event.preventDefault()
      }

      this.dispatchEvent(activeWindowChangeEvent(this.delegatingAppId))
      super.close(event)
    }
  }

  return DialogMixin
}