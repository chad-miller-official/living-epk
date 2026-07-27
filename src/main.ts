import './components/icon.ts'
import './components/window.ts'

import $ from 'jquery'
import type {EpkIcon} from "./components/icon.ts";

function deselectIcons(element: JQuery, eventTarget: HTMLElement) {
  $(element)
    .children('epk-icon')
    .filter((_, epkIcon) => epkIcon !== eventTarget)
    .each((_, epkIcon) => {
      (epkIcon as EpkIcon).selected = false
    })
}

$(() => {
  $('main').on('click', function (event) {
    if (this === event.target || event.target.classList.contains('icon-container')) {
      deselectIcons($(this), event.target)
    }
  })

  $('.icon-container').on('click', function (event) {
    deselectIcons($(this), event.target)
  })
})