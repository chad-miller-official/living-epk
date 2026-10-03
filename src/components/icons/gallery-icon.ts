import {customElement, property} from "lit/decorators.js";
import {EpkIcon} from "../icon.ts";
import type {EpkApp} from "../app.ts";
import {ImageGallery} from "../apps/image-gallery.ts";

@customElement('gallery-icon')
export class GalleryIcon extends EpkIcon {
  icon = '/img/gallery.ico'

  @property({type: String})
  fsSpecPath!: string

  getAppInstance(): Promise<EpkApp> {
    return new Promise<ImageGallery>(resolve => {
      const imageGallery = new ImageGallery()
      imageGallery.fsSpecPath = this.fsSpecPath
      return resolve(imageGallery)
    })
  }
}