import {customElement, property, query, queryAll, state} from "lit/decorators.js";
import {css, html, nothing, type TemplateResult} from "lit";
import {activeWindowChangeEvent, launchEvent, windowPropertyChangeEvent} from "../../lib/events.ts";
import {type ToolbarMenu, type ToolbarMenuItem, ToolbarUiElement} from "../ui/toolbar.ts";
import {EpkApp} from "../app.ts";
import {type LinkNode, loadFolderNode} from "../../lib/fs.ts";
import {alertDialog, playClick, warnDialog} from "../../lib/os.ts";
import {Explorer} from "./common/explorer.ts";
import {WindowState} from "../window.ts";
import {Dialog} from "./dialog/dialog.ts";

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
    ]
  }
]

@customElement('internet-explorer')
export class InternetExplorer extends Explorer<string | LinkNode> {
  static styles = [
    ...Explorer.styles,
    css`
      .favorites-folder {
        & > summary.favorite-icon {
          cursor: initial;
          padding: 2px;

          &.active {
            background-color: #316AC5;
            color: #ffffff;
          }
        }

        &[open] {
          border: 1px solid #7F9DB9;
        }

        summary:focus {
          outline: none;
        }
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

      iframe {
        border: 1px groove rgb(199, 197, 178);
        color-scheme: light;
        width: 100%;
      }
    `
  ]

  @query('iframe')
  frame?: HTMLIFrameElement

  @queryAll('.favorite-icon')
  favoriteIcons?: HTMLElement[]

  @queryAll('.favorites-folder')
  favoritesFolders?: HTMLDetailsElement[]

  @property()
  path: string | LinkNode = HOME

  @property({type: String})
  windowTitle = 'Microsoft Internet Explorer'

  @property({type: String})
  windowIcon = '/img/icons/small/internet-explorer.ico'

  @state()
  isLoading = true

  @state()
  isFullscreen = false

  @state()
  showExperimentalWarning = true

  toolbarSpec: ToolbarMenu[] = [
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

                internetExplorer.path = this.path
                internetExplorer.showAddressBar = this.showAddressBar
                internetExplorer.showStandardButtons = this.showStandardButtons
                internetExplorer.showStatusBar = this.showStatusBar
                internetExplorer.pathStack = this.pathStack
                internetExplorer.pathStack.pop()

                this.dispatchEvent(launchEvent(() => new Promise<InternetExplorer>(resolve => resolve(internetExplorer))))
              }
            },
          ],
        },
        ToolbarUiElement.DIVIDER,
        {text: 'Print...', shortcut: 'Ctrl+P', action: () => window.print()},
        ToolbarUiElement.DIVIDER,
        this.toolbarCloseItem,
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
        this.toolbarViewToolbarsItem,
        this.toolbarViewStatusBarItem,
        ToolbarUiElement.DIVIDER,
        this.toolbarViewGoToItems([
          ToolbarUiElement.DIVIDER,
          {
            text: 'Home Page',
            shortcut: 'Alt+Home',
            action: () => this.goHome(),
          }]
        ),
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
            
            this.dispatchEvent(windowPropertyChangeEvent({
              state: this.isFullscreen ? WindowState.FULLSCREEN : WindowState.DEFAULT
            }))
          }
        }
      ],
    },
    {
      text: 'Favorites',
      items: this.buildFavoritesMenuItems(FAVORITES),
    },
    this.toolbarHelpMenu('Internet Explorer', () => {
      const about = new InternetExplorerAbout()
      about.delegatingAppId = this.getAppId()
      return about
    }),
  ]

  firstUpdated() {
    const ieThis = this

    this.frame?.addEventListener('load', () => {
      this.isLoading = false

      this.getFrameDocument()
        ?.addEventListener('click', () => ieThis.dispatchEvent(activeWindowChangeEvent()))
    })

    window.addEventListener('blur', () => {
      if (this.shadowRoot?.activeElement === this.frame) {
        this.toolbar?.closeAll()
      }
    })
  }

  getMinimumDimensions() {
    return {width: 400, height: 320}
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

  navigate(newPath: string) {
    if (this.getTruePath(true).replace(/\\?$/, '') === newPath.replace(/\\?$/, '')) {
      return
    }

    playClick().then(async () => {
      let newPathToUse: string | LinkNode | undefined

      if (newPath.startsWith('C:')) {
        const parts = newPath.split('\\')
        parts.pop()
        const path = parts.join('\\')
        const folder = await loadFolderNode(path)

        newPathToUse = folder.fileLinks.find(l => l.logicalPath === newPath)

        if (!newPathToUse) {
          alertDialog(this, 'Microsoft Internet Explorer', `Cannot find '${newPath}'. Make sure the path or Internet address is correct.`)
        }
      } else {
        newPathToUse = newPath

        if (!newPathToUse.match(/^https?:\/\//)) {
          newPathToUse = `https://${newPathToUse}`
        }

        if (newPathToUse.startsWith('http') && this.showExperimentalWarning) {
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

      this.path = newPathToUse!
      this.pathStack.push(newPathToUse!)
    })
  }

  getTruePath(logical: boolean) {
    return typeof this.path === 'string' ? this.path : logical ? this.path.logicalPath : this.path.physicalPath
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
    let target = event.target as HTMLElement

    if (!target.classList.contains('favorite-icon')) {
      target = target.parentElement!
    }

    target.classList.add('active')

    const parent = target.parentElement!

    Array.from(this.favoritesFolders!)
      .filter(e => e !== parent)
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
              <img src="/img/explorer/folder-closed.png"/>
              <span>${f.title}</span>
            </summary>
            ${this.buildFavoritesPanel(f.favorites)}
          </details>`
      }
    })
  }

  getNavigationButtons() {
    return html`
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
      <button type="button" class="style-2 ${this.showSidebar ? 'active' : ''}"
              @click="${() => this.showSidebar = !this.showSidebar}">
        <img src="/img/internet-explorer/favorites.png"/>
        <span>Favorites</span>
      </button>
      <div class="divider"></div>
      <button type="button" class="style-2"
              @click="${() => window.print()}">
        <img src="/img/internet-explorer/print.png"/>
      </button>`
  }

  getAddressBar() {
    return html`
      <img src="/img/internet-explorer/default.ico"/>
      <input type="text" .value="${this.getTruePath(true)}" id="pathInput"/>`
  }

  getSidebarContent() {
    return html`
      <div class="favorites-icons">
        ${this.buildFavoritesPanel(FAVORITES)}
      </div>`
  }

  getMainContent() {
    return html`
      <iframe src="${this.getTruePath(false)}"></iframe>`
  }

  getStatusBarFields() {
    return html`
      <p class="status-bar-field">
        <img src="/img/internet-explorer/default.ico"/>
        <span class="loading-text">
              ${this.isLoading ? `Opening page ${this.getTruePath(true)}...` : 'Done.'}
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
      </p>`
  }
}

@customElement('internet-explorer-about')
class InternetExplorerAbout extends Dialog(EpkApp) {
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