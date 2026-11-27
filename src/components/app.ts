import {css, LitElement, unsafeCSS} from "lit"
import xpStyle from 'xp.css/dist/XP.css?inline'
import {query, queryAll, queryAssignedElements} from "lit/decorators.js";
import {EpkToolbar} from "./ui/toolbar.ts";
import type {LinkNode} from "../lib/fs.ts";
import {closeWindowEvent} from "../lib/events.ts";
import type {Dimensions} from "./window.ts";
import type {AbstractConstructor} from "../lib/lang.ts";
import type {EpkIcon} from "./icon.ts";

export type EpkAppConstructor = AbstractConstructor<EpkApp>

export const APP_DEFAULT_MINIMUM_HEIGHT = 128
export const APP_DEFAULT_MINIMUM_WIDTH = 128

export abstract class EpkApp extends LitElement {
  static styles = [
    unsafeCSS(xpStyle),
    css`
      .app {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .content {
        flex: 1;
        min-height: 0;
      }

      .status-bar {
        margin: 0;
      }

      .status-bar-field {
        user-select: none;

        &.spacer {
          width: 40%;
        }
      }

      epk-toolbar {
        z-index: 10000;
      }`
  ]

  @query('#toolbar')
  toolbar?: EpkToolbar

  @queryAll('.epk-icon')
  shadowDomIcons?: EpkIcon[]

  @queryAssignedElements({selector: '.epk-icon', flatten: true})
  lightDomIcons?: EpkIcon[]

  abstract windowTitle: string
  abstract windowIcon: string | null

  private appId: string = crypto.randomUUID()
  protected trackLastPosition = true

  getAppId(): string {
    return this.appId
  }

  getContainedIcons(): EpkIcon[] {
    return [...(this.shadowDomIcons || []), ...(this.lightDomIcons || [])]
  }

  getMinimumDimensions(): Partial<Dimensions> {
    return {width: APP_DEFAULT_MINIMUM_WIDTH, height: APP_DEFAULT_MINIMUM_HEIGHT}
  }

  getPositionTrackingName(): string {
    return this.constructor.name
  }

  isPositionTrackingEnabled(): boolean {
    return this.trackLastPosition
  }

  handleClick(event: Event) {
    if (event.target !== this.toolbar) {
      this.toolbar?.closeAll()
    }

    this.getContainedIcons().filter(i => i !== event.target).forEach(i => i.deselect())
  }

  handleFilePicked(_file?: LinkNode) {
    return
  }

  close(..._: any[]) {
    this.dispatchEvent(closeWindowEvent())
  }
}