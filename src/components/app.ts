import {css, LitElement, unsafeCSS} from "lit"
import xpStyle from 'xp.css/dist/XP.css?inline'

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
  abstract windowIcon: string | null
}