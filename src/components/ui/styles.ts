import {css} from "lit";

export const EXTENDED_UI_STYLE = css`
  button.tool-button {
    align-items: center;
    background: transparent;
    border: 1px solid transparent;
    display: flex;
    gap: 8px;
    justify-content: center;
    min-height: 0;
    min-width: 0;
    padding: 1px 4px;

    &:focus {
      outline: none;
    }

    &:not([disabled]) {
      &:hover {
        background: #f3f4f7 none;
        box-shadow: inset 0 -6px 6px -7px rgba(0, 0, 0, 0.4);
        border: 1px solid #cecec3;
        outline: none;
      }
    }

    &.active, &.active:hover {
      background: #ffffff none;
      border: 1px solid #7a98af;
    }

    &.active:hover {
      box-shadow: inset 0 -6px 6px -7px rgba(0, 0, 0, 0.4);
    }

    &:not([disabled]):active, &.active:active {
      background: #E6EAD8 none;
      border: 1px solid #A1A192;
      color: #ffffff;
    }

    &[disabled] > img {
      filter: grayscale(1);
      opacity: 0.5;
    }

    * {
      user-select: none;
    }
  }

  div.divider {
    background-color: #ccc8b6;
    height: 85%;
    margin: 2px;
    width: 1px;
  }`

export const OLD_UI_STYLE = css`
  .button-group.old-style {
    align-items: center;
    display: flex;
  }

  button.old-style {
    align-items: center;
    background: #ece9d8;
    border-bottom: 2px solid #716f64;
    border-left: 2px solid #ffffff;
    border-right: 2px solid #716f64;
    border-top: 2px solid #ffffff;
    border-radius: 0;
    display: flex;
    height: 24px;
    justify-content: center;
    min-height: 0;
    min-width: 0;
    padding: 0;
    width: 24px;

    &[disabled] img {
      opacity: 0.3;
    }

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

    &:not([disabled]):active {
      border-bottom: 2px solid #ffffff;
      border-left: 2px solid #716f64;
      border-right: 2px solid #ffffff;
      border-top: 2px solid #716f64;

      > * {
        padding: 2px 0 0 2px;
      }
    }

    &.small {
      align-self: start;
      height: fit-content;
      padding: 3px;
      width: fit-content;

      &:not([disabled]):active * {
        padding: 0;
      }
    }
  }

  .embossed {
    &.deep {
      border-bottom: 2px solid #f1efe2;
      border-left: 2px solid #716f64;
      border-right: 2px solid #f1efe2;
      border-top: 2px solid #716f64;
    }

    &.shallow {
      border-bottom: 1px solid #ffffff;
      border-left: 1px solid #aca899;
      border-right: 1px solid #ffffff;
      border-top: 1px solid #aca899;
    }
  }`