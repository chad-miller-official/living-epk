import {css, LitElement, unsafeCSS} from "lit"
import xpStyle from 'xp.css/dist/XP.css?inline'
import {query} from "lit/decorators.js";
import {EpkToolbar} from "./ui/toolbar.ts";
import type {LinkNode} from "../lib/fs.ts";
import {closeWindowEvent} from "../lib/events.ts";
import type {Dimensions} from "./window.ts";
import type {AbstractConstructor} from "../lib/lang.ts";

export type EpkAppConstructor = AbstractConstructor<EpkApp>

export abstract class EpkApp extends LitElement {
  static styles = [
    unsafeCSS(xpStyle),
    css`
      @font-face {
        font-family: 'Franklin Gothic Medium';
        font-style: normal;
        font-weight: normal;
        src: local('Franklin Gothic Medium'), url('/font/OPTIFranklinGothic-Medium.otf') format('otf');
      }

      @font-face {
        font-family: 'Franklin Gothic Medium Italic';
        font-style: italic;
        font-weight: normal;
        src: local('Franklin Gothic Medium'), url('/font/OPTIFranklinGothic-MediumIt.otf') format('otf');
      }

      @font-face {
        font-family: 'Tahoma';
        font-style: normal;
        font-weight: normal;
        src: local('Tahoma'), url('/font/Tahoma V1.woff') format('woff');
      }

      @font-face {
        font-family: 'Verdana Bold';
        font-style: normal;
        font-weight: bold;
        src: local('Verdana'), url('/font/Verdana-Bold.ttf') format('ttf');
      }

      #toolbar {
        z-index: 10000;
      }

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
      }

      .status-bar-field.spacer {
        width: 40%;
      }
    `
  ]

  @query('#toolbar')
  toolbar?: EpkToolbar

  abstract windowTitle: string
  abstract windowIcon: string | null

  doNotTrackLastPosition = false

  protected _appId: string = crypto.randomUUID()

  getAppId(): string {
    return this._appId
  }

  getMinimumDimensions(): Partial<Dimensions> {
    return {width: 128, height: 128}
  }

  getPositionTrackingName(): string {
    return this.constructor.name
  }

  handleClick(event: Event) {
    if (event.target !== this.toolbar) {
      this.toolbar?.closeAll()
    }
  }

  handleFilePicked(_file?: LinkNode) {
    return
  }

  close(_?: Event) {
    this.dispatchEvent(closeWindowEvent())
  }
}