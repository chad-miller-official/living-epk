import {css, LitElement, unsafeCSS} from "lit"
import xpStyle from 'xp.css/dist/XP.css?inline'

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
        flex-grow: 1;
        height: 100%;
      }

      .content, .toolbar {
        margin: 0 auto;
        width: calc(100% - 6px);
      }

      .status-bar-field.spacer {
        width: 40%;
      }
    `
  ]

  abstract windowTitle: string
  abstract windowIcon: string
}