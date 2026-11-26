import {customElement, property} from "lit/decorators.js";
import {Dialog} from "./dialog.ts";
import {EpkApp} from "../../app.ts";
import {css, html} from "lit";
import {launchEvent} from "../../../lib/events.ts";
import {InternetExplorer} from "../internet-explorer.ts";

@customElement('internet-explorer-about')
export class InternetExplorerAbout extends Dialog(EpkApp) {
  static styles = [
    ...EpkApp.styles,
    css`
      .about {
        column-gap: 56px;
        display: grid;
        font-family: "Pixelated MS Sans Serif", Arial;
        grid-template-areas:
          ". info"
          "logo form";
        justify-content: start;
        row-gap: 8px;
      }

      .content {
        background-color: #ffffff;
      }

      .credits {
        border: 1px solid #7f9db9;
        height: 5lh;
        max-height: 5lh;
        overflow-y: scroll;
        padding: 1px;
      }

      .form {
        align-items: center;
        display: flex;
        grid-area: form;
        justify-content: space-between;
      }

      .form, .info {
        max-width: 300px;
        width: 300px;
      }

      .info {
        align-items: flex-start;
        display: flex;
        flex-direction: column;
        gap: 8px;
        grid-area: info;
      }

      .link {
        cursor: pointer;
        text-decoration: underline;
      }

      .logo {
        grid-area: logo;
        width: 32px;
      }
    `
  ]

  @property({type: String})
  windowIcon = '/img/icons/small/internet-explorer.ico'

  @property({type: String})
  windowTitle = 'About Internet Explorer'

  handleCopyrightClick(event: Event) {
    event.stopPropagation()

    this.dispatchEvent(launchEvent(() => new Promise<InternetExplorer>(resolve => {
      const ie = new InternetExplorer()
      ie.path = 'https://web.archive.org/web/20030828184444/http://www.microsoft.com/isapi/redir.dll?prd=ie&pver=6.0&ar=aboutie&sba=copyr'
      resolve(ie)
    })))
  }

  render() {
    return html`
      <div class="app">
        <div class="content">
          <div class="about window-body">
            <div class="info">
              <img src="/img/internet-explorer/about.png"/>
              <div>
                Version: 6.0.2900.5512.xpsp.080413-2111
                <br/>
                Cipher Strength: 128-bit
                <br/>
                Product ID: 76487-640-8834005-23454
                <br/>
                Update Versions:; SP3;
              </div>
              <div class="credits">
                Based on NCSA Mosaic. NCSA Mosaic(TM); was developed at the National Center for
                Supercomputing Applications at the University of Illinois at Urbana-Champaign.
                <br/>
                Distributed under a licensing agreement with Spyglass, Inc.
                <br/>
                Contains security software licensed from RSA Data Security Inc.
                <br/>
                Portions of this software are based in part on the work of the Independent JPEG
                Group.
                <br/>
                Multimedia software components, including Indeo(R); video, Indeo(R) audio, and Web
                Design Effects are provided by Intel Corp.
                <br/>
                Unix version contains software licensed from Mainsoft Corporation. Copyright (c)
                1998-1999 Mainsoft Corporation. All rights reserved. Mainsoft is a trademark of
                Mainsoft Corporation.
                <br/>
                Warning: This computer program is protected by copyright law and international
                treaties. Unauthorized reproduction or distribution of this program, or any portion
                of it, may result in severe civil and criminal penalties, and will be prosecuted to
                the maximum extent possible under the law.
              </div>
            </div>
            <img class="logo" src="/img/logo.png"/>
            <form class="form" @submit="${this.close}">
              <p class="link" @click=${this.handleCopyrightClick}>Copyright &copy; 1995-2004
                Microsoft Corp.</p>
              <button type="submit">OK</button>
            </form>
          </div>
        </div>
      </div>`
  }
}