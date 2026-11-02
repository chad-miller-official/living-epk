import {css} from "lit";

export const buttonStyle2 = css`
  button.style-2 {
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
  }
`