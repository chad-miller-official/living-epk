import {getFileExtension} from "../../lib/fs.ts";
import {customElement, property, query, state} from "lit/decorators.js";
import {css, html} from "lit";
import {EpkApp} from "../app.ts";
import {type ToolbarMenu, ToolbarUiElement} from "../../lib/toolbar.ts";
import {closeWindowEvent, DISALLOW_ALL, launchEvent} from "../../lib/events.ts";
import {EpkToolbar} from "../ui.ts";
import {Notepad} from "./notepad.ts";

@customElement('audio-player')
export class AudioPlayer extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    css`
      .buttons {
        padding: 2px;
        border-right: 1px solid black;
        display: flex;
        gap: 8px;
      }

      .button-group {
        display: flex;

        &:last-of-type {
          padding-right: 4px;
        }

        button {
          background: #ece9d8;
          border-bottom: 2px solid #716f64;
          border-left: 2px solid #ffffff;
          border-right: 2px solid #716f64;
          border-top: 2px solid #ffffff;
          border-radius: 0;
          height: 24px;
          min-height: 0;
          min-width: 0;
          padding: 0;
          width: 24px;

          &:focus {
            border-bottom: 2px solid #716f64;
            border-left: 2px solid #ffffff;
            border-right: 2px solid #716f64;
            border-top: 2px solid #ffffff;
            box-shadow: none;
            outline: none;
          }

          &:hover {
            box-shadow: none;
          }

          &:active {
            border-bottom: 2px solid #ffffff;
            border-left: 2px solid #716f64;
            border-right: 2px solid #ffffff;
            border-top: 2px solid #716f64;

            * {
              padding: 2px 0 0 2px;
            }
          }
        }
      }

      .content {
        display: flex;
        flex-direction: column;
        user-select: none;
      }

      .controls {
        border-top: 1px solid black;
        display: flex;
      }

      .timer-wrapper {
        display: flex;
        flex-grow: 1;
        width: 100%;
      }

      .timer {
        border-bottom: 1px solid #ffffff;
        border-left: 1px solid #aca899;
        border-right: 1px solid #ffffff;
        border-top: 1px solid #aca899;
        font-family: "Pixelated MS Sans Serif", Arial;
        margin: 6px;
        padding: 3px 1px;
        width: 100%;
      }

      audio {
        width: 100%;
      }
    `
  ]

  @query('#audioPlayer')
  audioPlayer!: HTMLAudioElement

  @query('#toolbar')
  toolbar!: EpkToolbar

  @property({type: String})
  windowTitle = 'Media Player'

  @property({type: String})
  windowIcon = '/img/media-player-small.ico'

  @property({type: String})
  filePath: string | undefined

  @state()
  mimeType: string | undefined

  @state()
  isPlaying = false

  @state()
  isEnded = false

  @state()
  timerText = '00:00'

  toolbarSpec: ToolbarMenu[] = [
    {
      text: 'File',
      items: [
        {
          text: 'Open...', action: () => {
          },
        },
        {
          text: 'Close', action: () => {
          }
        },
        ToolbarUiElement.DIVIDER,
        {
          text: 'Exit', action: () => this.dispatchEvent(closeWindowEvent()),
        },
      ]
    },
    {
      text: 'Help',
      items: [
        {
          text: 'About Notepad',
          action: (event: Event) => {
            event.stopPropagation()
            this.toolbar.closeAll()

            this.dispatchEvent(launchEvent(() => new Promise<AudioPlayerAbout>(resolve => resolve(new AudioPlayerAbout())), {
              width: 419,
              height: 350,
              disallowFlags: DISALLOW_ALL,
            }))
          },
        },
      ],
    },
  ]

  connectedCallback() {
    super.connectedCallback()

    if (this.filePath) {
      this.mimeType = `audio/${getFileExtension(this.filePath)}`
    }
  }

  handleClick(event: MouseEvent) {
    if (event.target !== this.toolbar) {
      this.toolbar.closeAll()
    }
  }

  handlePlayPauseClick() {
    if (this.isPlaying) {
      this.audioPlayer.pause()
      this.isPlaying = !this.isPlaying
    } else {
      if (this.isEnded) {
        this.isEnded = false
        this.audioPlayer.currentTime = 0
      }

      this.audioPlayer.play().then(() => this.isPlaying = !this.isPlaying)
    }
  }

  handleStopClick() {
    this.audioPlayer.pause()
    this.audioPlayer.currentTime = 0
    this.isPlaying = false
    this.isEnded = false
  }

  handleTimeUpdate() {
    const currentTime = this.audioPlayer.currentTime
    const minutes = Math.trunc(currentTime / 60)
    const seconds = Math.round(currentTime % 60)
    this.timerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  handleEnded() {
    this.isPlaying = false
    this.isEnded = true
  }

  render() {
    return html`
      <div class="app" @click="${this.handleClick}">
        <epk-toolbar id="toolbar" class="toolbar" .toolbarSpec="${this.toolbarSpec}"></epk-toolbar>
        <div class="content">
          <div class="timeline">
            <audio id="audioPlayer" @timeupdate="${this.handleTimeUpdate}"
                   @ended="${this.handleEnded}">
              <source src="${this.filePath}" type="${this.mimeType}"/>
            </audio>
          </div>
          <div class="controls">
            <div class="buttons">
              <div class="button-group">
                <button @click="${this.handlePlayPauseClick}">
                  <img src="${`/img/media-player/${this.isPlaying ? 'pause' : 'play'}.png`}"/>
                </button>
                <button @click="${this.handleStopClick}">
                  <img src="/img/media-player/stop.png"/>
                </button>
              </div>
              <div class="button-group">
                <button>
                  <img src="/img/media-player/previous-mark.png"/>
                </button>
                <button>
                  <img src="/img/media-player/rewind.png"/>
                </button>
                <button>
                  <img src="/img/media-player/fast-forward.png"/>
                </button>
                <button>
                  <img src="/img/media-player/next-mark.png"/>
                </button>
              </div>
              <div class="button-group">
                <button>
                  <img src="/img/media-player/start-selection.png"/>
                </button>
                <button>
                  <img src="/img/media-player/end-selection.png"/>
                </button>
              </div>
            </div>
            <div class="timer-wrapper">
              <span class="timer">${this.timerText} (min:sec)</span>
            </div>
          </div>
        </div>
      </div>`
  }
}

@customElement('audio-player-about')
export class AudioPlayerAbout extends EpkApp {
  static styles = [
    ...EpkApp.styles,
    css`
      .about {
        display: flex;
        flex-direction: column;
        font-family: "Pixelated MS Sans Serif", Arial;
        height: 100%;
      }

      .about-text {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .about-wrapper {
        align-items: flex-start;
        display: flex;
        gap: 8px;
        height: 100%;
        padding: 14px;

        .upper {
          height: 70%;
        }

        .lower {
          align-items: flex-start;
          height: 30%;
        }

        .upper, .lower {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        p {
          margin: 0 0 6px 0;
        }
      }

      .eula {
        color: #082ea2;
        cursor: pointer;
        text-decoration: underline;
      }

      .eula-user {
        margin: 10px 0 18px 14px;
      }

      .memory {
        width: 100%;
      }

      button {
        align-self: flex-end;
      }

      hr {
        width: 100%;
      }
    `
  ]

  windowTitle = 'About Media Player'
  windowIcon = null

  handleEulaClick(event: Event) {
    event.stopPropagation()

    this.dispatchEvent(launchEvent(() => new Promise<Notepad>(resolve => {
      const notepad = new Notepad()
      notepad.windowTitle = `Notepad - eula`
      notepad.filePath = '/fs/plaintext/eula.txt'
      resolve(notepad)
    })))
  }

  requestClose() {
    this.dispatchEvent(closeWindowEvent())
  }

  render() {
    return html`
      <div class="app">
        <div class="content">
          <div class="about">
            <img src="/img/banner.png" width="413" alt="Banner"/>
            <div class="about-wrapper">
              <img src="/img/media-player.ico" alt="Notepad"/>
              <div class="about-text">
                <div class="upper">
                  <div>
                    <p>Microsoft &reg; Media Player</p>
                    <p>Version 5.1 (Build 2600.xpsp.080413-2111 : Service Pack 3)</p>
                    <p>Copyright &copy; 2007 Microsoft Corporation</p>
                  </div>
                  <div>
                    <p>
                      This product is licensed under the terms of the
                      <span class="eula"
                            @click="${this.handleEulaClick}">End-User License Agreement</span>
                      to:
                    </p>
                    <p class="eula-user">chad</p>
                  </div>
                </div>
                <div class="lower">
                  <div class="memory">
                    <hr/>
                    <div>
                      Physical memory available to Windows:
                      <span class="memory">196,080 KB</span>
                    </div>
                  </div>
                  <button @click="${this.requestClose}">OK</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`
  }
}