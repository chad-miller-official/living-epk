import './components/icon.ts'
import './components/window.ts'

import $ from 'jquery'
import {EpkIcon} from "./components/icon.ts";
import {EpkWindow} from "./components/window.ts";

function handleIconContainerClick(this: Element, event: Event) {
  if (this === event.target) {
    $(this)
      .children('epk-icon')
      .filter((_, epkIcon) => epkIcon !== event.target)
      .each((_, epkIcon) => {
        (epkIcon as EpkIcon).selected = false
      })
  }
}

$(() => {
  $('main').on('click', handleIconContainerClick)
  $('main').on('click', 'epk-window', handleIconContainerClick)
})

function spawnMyDocuments() {
  const epkWindow = new EpkWindow()
  epkWindow.title = 'My Documents'
  epkWindow.thumbnail = '/img/795.ico'

  const contents = $('<section>')
    .addClass('icon-container')
    .on('click', handleIconContainerClick)

  contents.append(['123.mp3', '456.mp3'].map(fileName => {
    const icon = new EpkIcon()
    icon.image = '/img/1135.ico'
    icon.innerText = fileName
    icon.classList.add('epk-icon')
    return icon
  }))

  $(epkWindow).append(contents)
  $('main').append(epkWindow)
}

// @ts-ignore
window['spawnMyDocuments'] = spawnMyDocuments