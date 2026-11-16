import {customElement, property, query, queryAll, state} from "lit/decorators.js";
import {css, html, nothing, type TemplateResult} from "lit";
import {
  closeWindowEvent,
  DisallowFlags,
  focusWindowEvent,
  launchEvent,
  windowPropertyChangeEvent
} from "../../lib/events.ts";
import {type ToolbarMenu, type ToolbarMenuItem, ToolbarUiElement} from "../ui/toolbar.ts";
import {EpkApp} from "../app.ts";
import {type LinkNode, loadFolderNode} from "../../lib/fs.ts";
import {alertDialog, warnDialog} from "../../lib/os.ts";
import {buttonStyle2} from "../../lib/ui.ts";
import {styleMap} from "lit/directives/style-map.js";

const COOKIE_EXPERIMENTAL_WARNING = 'quietIeExperimentalWarning'

const HOME = 'https://web.archive.org/web/20080422002359/http://www.msn.com/'

type Favorite = {
  url: string,
  title: string,
  icon?: string,
}

type FavoriteFolder = {
  title: string,
  favorites: Favorite[],
}

const FAVORITES: (FavoriteFolder | Favorite)[] = [
  {
    title: "My Friends' Websites",
    favorites: [
      {
        url: 'https://www.handsomekrish.live/',
        title: 'DJ Handsome Krish',
      },
      {
        url: 'https://jackmcintoshthomson.com/',
        title: 'Jack McIntosh Thomson',
      },
      {
        url: 'https://matthewritch.com/',
        title: 'Matthew Ritch',
      },
    ],
  },
  {
    title: 'Websites I Like',
    favorites: [
      {
        url: 'https://toshihak.lolipop.jp/index.html',
        title: "Someone in Japan's website that's been online since 1997",
      },
      {
        url: 'https://speech.seedy.cc/',
        title: 'Speech synthesizer',
      },
      {
        url: 'https://compend.org/',
        title: 'Rate everything',
      },
    ]
  }
]

@customElement('internet-explorer')
export class InternetExplorer extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    buttonStyle2,
    css`
      #closeButton {
        height: 18px;
        width: 18px;
      }

      #favorites {
        flex-shrink: 0;
        min-width: 12ch;
        overflow: auto;
      }

      #goButton {
        padding: 0 16px 0 8px;
      }

      #pathInput {
        flex-grow: 1;
      }

      .address {
        align-self: center;
        opacity: 0.5;
        padding: 0 4px;
      }

      .address-bar {
        align-items: center;
        background-color: #ffffff;
        border: 1px solid #7f9db9;
        display: flex;
        padding-left: 3px;
        width: 100%;

        & > input {
          border: none;
        }
      }

      .explorer {
        background-color: #ffffff;
        display: flex;
        height: 100%;
      }

      .explorer-divider {
        background-color: #eee9d5;
        cursor: col-resize;
        min-width: 5px;
        max-width: 5px;
        width: 5px;
      }

      .favorites-folder {
        & > summary.favorite-icon {
          cursor: initial;
          padding: 2px;

          &::before {
            background-image: url("/img/internet-explorer/folder-closed.png");
            content: "";
            height: 16px;
            width: 16px;
          }

          &.active {
            background-color: #316AC5;
            color: #ffffff;
          }
        }

        &[open] {
          border: 1px solid #7F9DB9;

          & > summary.favorite-icon::before {
            background-image: url("/img/internet-explorer/folder-open.png");
          }
        }

        summary:focus {
          outline: none;
        }
      }

      .favorites-header {
        align-items: center;
        background: linear-gradient(to right, #f3f4f7, #eee9d5);
        display: flex;
        justify-content: space-between;
        padding: 3px 7px;
      }

      .favorites-icons {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin: 2px;
      }

      .favorite-icon {
        align-items: center;
        cursor: pointer;
        display: flex;
        gap: 3px;
        padding: 2px 2px 2px 16px;

        &:hover {
          color: #316AC5;
          text-decoration: underline;
        }

        &.active {
          background-color: #ece9d8;

          &:hover {
            color: #ffffff;
          }
        }

        & > span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .hidden {
        display: none;
      }

      .navigation {
        align-items: stretch;
        background-color: #eceadb;
        border-bottom: 1px groove #c7c5b2;
        display: flex;
        width: 100%;

        button {
          padding: 9px 7px;
          margin: 1px;
        }
      }

      .loading-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .status-bar-field {
        align-items: center;
        display: flex;
        gap: 1ch;
        overflow: hidden;

        &.blank {
          max-width: 18px;
        }

        &.internet {
          max-width: 150px;
        }

        &.loading-bar {
          max-width: fit-content;
        }
      }

      .viewport {
        -webkit-font-smoothing: none;
        display: flex;
        flex-direction: column;
        font-family: "Pixelated MS Sans Serif", Arial;
        font-size: 11px;
        height: 100%;
        user-select: none;
      }

      iframe {
        border: 1px groove rgb(199, 197, 178);
        color-scheme: light;
        width: 100%;
      }
    `
  ]

  static favoritesWidth = 160

  @query('#favorites')
  favorites!: HTMLDivElement

  @query('#pathInput')
  pathInput!: HTMLInputElement

  @query('iframe')
  frame?: HTMLIFrameElement

  @queryAll('.favorite-icon')
  favoriteIcons?: HTMLElement[]

  @queryAll('.favorites-folder')
  favoritesFolders?: HTMLDetailsElement[]

  @property()
  url: string | LinkNode = HOME

  @property({type: String})
  windowTitle = 'Microsoft Internet Explorer'

  @property({type: String})
  windowIcon = '/img/internet-explorer.ico'

  @state()
  isLoading = true

  @state()
  isFullscreen = false

  @state()
  showStandardButtons = true

  @state()
  showAddressBar = true

  @state()
  showStatusBar = true

  @state()
  showFavorites = false

  @state()
  showExperimentalWarning = true

  pathStack: (string | LinkNode)[] = []
  pathStackIdx = 0

  private toolbarSpec: ToolbarMenu[] = [
    {
      text: 'File',
      items: [
        {
          text: 'New',
          items: [
            {
              text: 'Window',
              shortcut: 'Ctrl+N',
              action: () => {
                const internetExplorer = new InternetExplorer()

                internetExplorer.url = this.url
                internetExplorer.showAddressBar = this.showAddressBar
                internetExplorer.showStandardButtons = this.showStandardButtons
                internetExplorer.showStatusBar = this.showStatusBar
                internetExplorer.pathStack = this.pathStack
                internetExplorer.pathStack.pop()
                internetExplorer.pathStackIdx = this.pathStackIdx

                this.dispatchEvent(launchEvent(() => new Promise<InternetExplorer>(resolve => resolve(internetExplorer))))
              }
            },
          ],
        },
        ToolbarUiElement.DIVIDER,
        {text: 'Print...', shortcut: 'Ctrl+P', action: () => window.print()},
        ToolbarUiElement.DIVIDER,
        {text: 'Close', action: () => this.dispatchEvent(closeWindowEvent())},
      ],
    },
    {
      text: 'Edit',
      items: [
        {
          text: 'Cut', shortcut: 'Ctrl+X', action: () => {
            navigator.clipboard.writeText(window.getSelection()?.toString() || '')

            this.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'Backspace',
              code: 'Backspace',
              keyCode: 8,
              which: 8,
              bubbles: true,
              cancelable: true,
            }))
          },
        },
        {
          text: 'Copy',
          shortcut: 'Ctrl+C',
          action: () => navigator.clipboard.writeText(this.frame?.contentWindow?.getSelection()?.toString() || ''),
        },
        {
          text: 'Paste',
          shortcut: 'Ctrl+V',
          action: () => navigator.clipboard.readText().then(text => this.getFrameDocument().execCommand('insertText', false, text)),
        },
        ToolbarUiElement.DIVIDER,
        {
          text: 'Select All',
          shortcut: 'Ctrl+A',
          action: () => {
            const selection = this.frame?.contentWindow?.getSelection()
            const range = this.getFrameDocument().createRange()

            selection?.removeAllRanges()

            range.selectNodeContents(this.getFrameDocument().body)
            selection?.addRange(range)
          }
        }
      ]
    },
    {
      text: 'View',
      items: [
        {
          text: 'Toolbars',
          items: [
            {
              text: 'Standard Buttons',
              selected: () => this.showStandardButtons,
              action: () => this.showStandardButtons = !this.showStandardButtons,
            },
            {
              text: 'Address Bar',
              selected: () => this.showAddressBar,
              action: () => this.showAddressBar = !this.showAddressBar,
            },
          ],
        },
        {
          text: 'Status Bar',
          selected: () => this.showStatusBar,
          action: () => this.showStatusBar = !this.showStatusBar,
        },
        ToolbarUiElement.DIVIDER,
        {
          text: 'Go To',
          items: [
            {
              text: 'Back',
              disabled: () => !this.canGoBack(),
              action: () => this.goBack(),
              shortcut: 'Alt+Left Arrow',
            },
            {
              text: 'Forward',
              disabled: () => !this.canGoForward(),
              action: () => this.goForward(),
              shortcut: 'Alt+Right Arrow',
            },
            ToolbarUiElement.DIVIDER,
            {
              text: 'Home Page',
              shortcut: 'Alt+Home',
              action: () => this.goHome(),
            }
          ]
        },
        {
          text: 'Stop',
          shortcut: 'Esc',
          action: this.stop,
        },
        {
          text: 'Refresh',
          action: this.refresh,
        },
        ToolbarUiElement.DIVIDER,
        {
          text: 'Full Screen',
          shortcut: 'F11',
          selected: () => this.isFullscreen,
          action: () => {
            this.isFullscreen = !this.isFullscreen
            this.dispatchEvent(windowPropertyChangeEvent({fullscreen: this.isFullscreen}))
          }
        }
      ],
    },
    {
      text: 'Favorites',
      items: this.buildFavoritesMenuItems(FAVORITES),
    },
    {
      text: 'Help',
      items: [
        {
          text: 'About Internet Explorer',
          action: (event: Event) => {
            event.stopPropagation()
            this.toolbar!.closeAll()

            const about = new InternetExplorerAbout()

            this.dispatchEvent(launchEvent(() => new Promise<InternetExplorerAbout>(resolve => resolve(about)), {
              width: 419,
              height: 350,
              disallowFlags: DisallowFlags.DisallowAll,
            }))
          },
        },
      ],
    }
  ]

  connectedCallback() {
    super.connectedCallback()
    this.pathStack.push(this.url)
  }

  firstUpdated() {
    this.frame?.addEventListener('load', () => {
      this.isLoading = false
      this.getFrameDocument()?.addEventListener('click', () => this.dispatchEvent(focusWindowEvent()))
    })

    window.addEventListener('blur', () => {
      if (this.shadowRoot?.activeElement === this.frame) {
        this.toolbar?.closeAll()
      }
    })
  }

  getMinimumDimensions(): [number | null, number | null] {
    return [400, 320]
  }

  buildFavoritesMenuItems(favorites: (Favorite | FavoriteFolder)[]): (ToolbarMenuItem | ToolbarMenu)[] {
    return favorites.map(f => {
      if ('url' in f) {
        return {
          text: f.title,
          icon: f.icon || '/img/internet-explorer/default.ico',
          action: () => this.navigate(f.url),
        }
      } else {
        return {
          text: f.title,
          items: this.buildFavoritesMenuItems(f.favorites)
        }
      }
    })
  }

  stop() {
    this.frame?.contentWindow?.stop()
  }

  refresh() {
    if (this.frame) {
      this.frame.src = this.frame.src
    }
  }

  goHome() {
    this.navigate(HOME)
  }

  getFrameDocument() {
    return this.frame?.contentDocument || this.frame?.contentWindow?.document!
  }

  playClick() {
    return new Audio('/audio/click.wav').play()
  }

  navigate(newUrl: string) {
    if (this.getTrueUrl(true).replace(/\\?$/, '') === newUrl.replace(/\\?$/, '')) {
      return
    }

    this.playClick().then(async () => {
      let newUrlToUse: string | LinkNode | undefined

      if (newUrl.startsWith('C:')) {
        const parts = newUrl.split('\\')
        parts.pop()
        const path = parts.join('\\')
        const folder = await loadFolderNode(path)

        newUrlToUse = folder.fileLinks.find(l => l.logicalPath === newUrl)

        if (!newUrlToUse) {
          alertDialog(this, 'Microsoft Internet Explorer', `Cannot find '${newUrl}'. Make sure the path or Internet address is correct.`)
        }
      } else {
        newUrlToUse = newUrl

        if (!newUrlToUse.match(/^https?:\/\//)) {
          newUrlToUse = `https://${newUrlToUse}`
        }

        if (newUrlToUse.startsWith('http') && this.showExperimentalWarning) {
          cookieStore.get(COOKIE_EXPERIMENTAL_WARNING).then(cookie => {
            if (cookie?.value !== 'true') {
              warnDialog(
                this,
                'Microsoft Internet Explorer',
                `Support for external webpages is experimental. The address bar may not
                reflect clicked links and the Back button may not behave as expected. Some external
                webpages additionally may not function correctly.`,
                {silenceId: COOKIE_EXPERIMENTAL_WARNING, buttonPosition: 'right'},
              )

              this.showExperimentalWarning = false
            }
          })
        }

        this.isLoading = true
      }

      this.url = newUrlToUse!
      this.pathStackIdx++
      this.pathStack.length = this.pathStackIdx
      this.pathStack.push(newUrlToUse!)
    })
  }

  canGoBack() {
    return this.pathStackIdx !== 0
  }

  canGoForward() {
    return this.pathStackIdx !== this.pathStack.length - 1
  }

  goBack() {
    if (this.pathStackIdx > 0) {
      this.playClick().then(() => {
        this.pathStackIdx--
        this.url = this.pathStack[this.pathStackIdx]
      })
    }
  }

  goForward() {
    if (this.pathStackIdx < this.pathStack.length - 1) {
      this.playClick().then(() => {
        this.pathStackIdx++
        this.url = this.pathStack[this.pathStackIdx]
      })
    }
  }

  handlePathInputSubmit(event: SubmitEvent) {
    event.preventDefault()
    this.navigate(this.pathInput.value)
  }

  getTrueUrl(logical: boolean) {
    return typeof this.url === 'string' ? this.url : logical ? this.url.logicalPath : this.url.physicalPath
  }

  private connectDividerDragListeners(handleMouseMove: (mouseMoveEvent: MouseEvent) => void) {
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  handlePrimaryDividerDrag(mouseDownEvent: MouseEvent) {
    const startX = mouseDownEvent.clientX
    const startWidth = this.favorites.offsetWidth

    this.connectDividerDragListeners((mouseMoveEvent: MouseEvent) => {
      const deltaX = mouseMoveEvent.clientX - startX
      InternetExplorer.favoritesWidth = startWidth + deltaX
      this.requestUpdate()
    })
  }

  selectFavorite(event: Event, favorite: Favorite) {
    let target = event.target as HTMLElement

    if (!target.classList.contains('favorite-icon')) {
      target = target.parentElement!
    }

    target.classList.add('active')

    Array.from(this.favoriteIcons!)
      .filter(e => e !== target)
      .forEach(e => e.classList.remove('active'))

    this.navigate(favorite.url)
  }

  expandFavoritesFolder(event: Event) {
    const target = event.target as HTMLElement
    target.classList.add('active')

    Array.from(this.favoritesFolders!)
      .filter(e => e !== target)
      .forEach(e => e.removeAttribute('open'))

    Array.from(this.favoriteIcons!)
      .filter(e => e !== target)
      .forEach(e => e.classList.remove('active'))
  }

  buildFavoritesPanel(favorites: (Favorite | FavoriteFolder)[]): TemplateResult[] {
    return favorites.map(f => {
      if ('url' in f) {
        return html`
          <div class="favorite-icon" @click="${(event: Event) => this.selectFavorite(event, f)}">
            <img src="${f.icon || '/img/internet-explorer/default.ico'}"/>
            <span>${f.title}</span>
          </div>`
      } else {
        return html`
          <details class="favorites-folder">
            <summary class="favorite-icon" @click="${this.expandFavoritesFolder}">
              ${f.title}
            </summary>
            ${this.buildFavoritesPanel(f.favorites)}
          </details>`
      }
    })
  }

  render() {
    const favoritesStyle: any = {width: `${InternetExplorer.favoritesWidth}px`}
    const primaryDividerStyle: any = {}

    if (!this.showFavorites) {
      favoritesStyle.display = 'none'
      primaryDividerStyle.display = 'none'
    }

    const contentUrl = this.getTrueUrl(false)

    return html`
      <div class="app" @click="${this.handleClick}">
        <epk-toolbar id="toolbar" .toolbarSpec="${this.toolbarSpec}"
                     logo="/img/internet-explorer/logo.png"></epk-toolbar>
        <section class="content">
          <div class="viewport">
            <div class="navigation ${this.showStandardButtons ? '' : 'hidden'}">
              <button type="button" id="backButton" class="style-2"
                      ?disabled="${!this.canGoBack()}" @click="${this.goBack}">
                <img src="/img/file-explorer/back.png"/>
                <span>Back</span>
              </button>
              <button type="button" id="forwardButton" class="style-2"
                      ?disabled="${!this.canGoForward()}" @click="${this.goForward}">
                <img src="/img/file-explorer/forward.png"/>
              </button>
              <button type="button" class="style-2" @click="${this.stop}">
                <img src="/img/internet-explorer/stop.png"/>
              </button>
              <button type="button" class="style-2" @click="${this.refresh}">
                <img src="/img/internet-explorer/refresh.png"/>
              </button>
              <button type="button" class="style-2" @click="${this.goHome}">
                <img src="/img/internet-explorer/home.png"/>
              </button>
              <div class="divider"></div>
              <button type="button" class="style-2 ${this.showFavorites ? 'active' : ''}"
                      @click="${() => this.showFavorites = !this.showFavorites}">
                <img src="/img/internet-explorer/favorites.png"/>
                <span>Favorites</span>
              </button>
              <div class="divider"></div>
              <button type="button" class="style-2"
                      @click="${() => window.print()}">
                <img src="/img/internet-explorer/print.png"/>
              </button>
            </div>
            <form class="navigation ${this.showAddressBar ? '' : 'hidden'}"
                  @submit="${this.handlePathInputSubmit}">
              <span class="address">Address</span>
              <div class="address-bar">
                <img src="/img/internet-explorer/default.ico"/>
                <input type="text" .value="${this.getTrueUrl(true)}" id="pathInput"/>
              </div>
              <button type="submit" id="goButton" class="style-2">
                <img src="/img/file-explorer/go.png"/>
                <span>Go</span>
              </button>
            </form>
            <div class="explorer">
              <div id="favorites" style="${styleMap(favoritesStyle)}">
                <div class="favorites-header">
                  Favorites
                  <button type="button" id="closeButton" class="style-2"
                          @click="${() => this.showFavorites = false}">
                    <img src="/img/file-explorer/x.png"/>
                  </button>
                </div>
                <div class="favorites-icons">
                  ${this.buildFavoritesPanel(FAVORITES)}
                </div>
              </div>
              <div class="explorer-divider" style="${styleMap(primaryDividerStyle)}"
                   @mousedown="${this.handlePrimaryDividerDrag}"></div>
              <iframe src="${contentUrl}"></iframe>
            </div>
          </div>
        </section>
        <div class="status-bar ${this.showStatusBar ? '' : 'hidden'}">
          <p class="status-bar-field">
            <img src="/img/internet-explorer/default.ico"/>
            <span class="loading-text">
              ${this.isLoading ? `Opening page ${this.getTrueUrl(true)}...` : 'Done.'}
            </span>
          </p>
          ${this.isLoading ? html`
            <p class="status-bar-field loading-bar">
              <progress max="100" value="${Math.floor(Math.random() * 100)}"></progress>
            </p>
          ` : nothing}
          <p class="status-bar-field blank"></p>
          <p class="status-bar-field blank"></p>
          <p class="status-bar-field blank"></p>
          <p class="status-bar-field blank"></p>
          <p class="status-bar-field blank"></p>
          <p class="status-bar-field internet">
            <img src="/img/internet-explorer/internet.ico"/>
            <span>Internet</span>
          </p>
        </div>
      </div>`
  }
}

@customElement('internet-explorer-about')
class InternetExplorerAbout extends EpkApp {
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

  windowIcon = '/img/internet-explorer.ico'
  windowTitle = 'About Internet Explorer'

  handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    this.dispatchEvent(closeWindowEvent())
  }

  handleCopyrightClick(event: Event) {
    event.stopPropagation()

    this.dispatchEvent(launchEvent(() => new Promise<InternetExplorer>(resolve => {
      const ie = new InternetExplorer()
      ie.url = 'https://web.archive.org/web/20030828184444/http://www.microsoft.com/isapi/redir.dll?prd=ie&pver=6.0&ar=aboutie&sba=copyr'
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
            <img class="logo" src="/img/internet-explorer/logo.png"/>
            <form class="form" @submit="${this.handleSubmit}">
              <p class="link" @click=${this.handleCopyrightClick}>Copyright &copy; 1995-2004
                Microsoft Corp.</p>
              <button type="submit">OK</button>
            </form>
          </div>
        </div>
      </div>`
  }
}