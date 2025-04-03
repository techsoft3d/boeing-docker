var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { Color } from "@hoops/web-viewer";
import { cssHexStringFromColor, rgbStringFromColor, colorFromRgbString, getValueAsString, centerWindow } from "./UiUtil.js";
class ColorPicker {
  constructor(viewer, containerId) {
    __publicField(this, "_viewer");
    __publicField(this, "_colorPickerId", `colorPicker`);
    __publicField(this, "_colorPickerHeaderId", `colorPickerHeader`);
    __publicField(this, "_colorPickerFooterId", `colorPickerFooter`);
    __publicField(this, "_colorPickerOkId", `colorPickerOk`);
    __publicField(this, "_colorPickerCancelId", `colorPickerCancel`);
    __publicField(this, "_colorPickerApplyId", `colorPickerApply`);
    __publicField(this, "_colorPickerInputId", `colorPickerInput`);
    __publicField(this, "_colorPickerActiveColorId", `colorPickerActiveColor`);
    __publicField(this, "_colorPickerActiveColorLabelId", `colorPickerActiveColorLabel`);
    __publicField(this, "_colorPickerActiveColorSwatchId", `colorPickerActiveColorSwatch`);
    //@ts-ignore
    __publicField(this, "_colorPicker");
    __publicField(this, "_color", Color.black());
    this._viewer = viewer;
    this._colorPicker = this._createColorPickerWindow(containerId);
    this._initElements();
  }
  _createColorPickerWindow(containerId) {
    const colorPicker = document.createElement(`div`);
    colorPicker.id = this._colorPickerId;
    colorPicker.classList.add(`desktop-ui-window`);
    const colorPickerHeader = document.createElement(`div`);
    colorPickerHeader.id = this._colorPickerHeaderId;
    colorPickerHeader.classList.add(`desktop-ui-window-header`);
    colorPickerHeader.innerHTML = `Color Picker`;
    const colorPickerContent = document.createElement(`div`);
    colorPickerContent.classList.add(`desktop-ui-window-content`);
    const colorPickerActiveColor = document.createElement("div");
    colorPickerActiveColor.id = this._colorPickerActiveColorId;
    colorPickerContent.appendChild(colorPickerActiveColor);
    const colorPickerActiveColorLabel = document.createElement("span");
    colorPickerActiveColorLabel.id = this._colorPickerActiveColorLabelId;
    colorPickerActiveColorLabel.innerHTML = `Active Color:`;
    colorPickerActiveColor.appendChild(colorPickerActiveColorLabel);
    const colorPickerActiveColorSwatch = document.createElement("span");
    colorPickerActiveColorSwatch.id = this._colorPickerActiveColorSwatchId;
    colorPickerActiveColorSwatch.style.backgroundColor = cssHexStringFromColor(this._color);
    colorPickerActiveColor.appendChild(colorPickerActiveColorSwatch);
    const colorPickerInput = document.createElement(`input`);
    colorPickerInput.id = this._colorPickerInputId;
    colorPickerInput.type = `text`;
    colorPickerInput.classList.add(`color-picker`);
    colorPickerContent.appendChild(colorPickerInput);
    const colorPickerFooter = document.createElement(`div`);
    colorPickerFooter.id = this._colorPickerFooterId;
    colorPickerFooter.classList.add(`desktop-ui-window-footer`);
    const colorPickerOkButton = document.createElement(`button`);
    colorPickerOkButton.id = this._colorPickerOkId;
    colorPickerOkButton.innerHTML = `Ok`;
    colorPickerFooter.appendChild(colorPickerOkButton);
    const colorPickerCancelButton = document.createElement(`button`);
    colorPickerCancelButton.id = this._colorPickerCancelId;
    colorPickerCancelButton.innerHTML = `Cancel`;
    colorPickerFooter.appendChild(colorPickerCancelButton);
    const colorPickerApplyButton = document.createElement(`button`);
    colorPickerApplyButton.id = this._colorPickerApplyId;
    colorPickerApplyButton.innerHTML = `Apply`;
    colorPickerFooter.appendChild(colorPickerApplyButton);
    colorPicker.appendChild(colorPickerHeader);
    colorPicker.appendChild(colorPickerContent);
    colorPicker.appendChild(colorPickerFooter);
    $(`#${containerId}`).append(colorPicker);
    $(colorPickerInput).minicolors({
      position: `bottom left`,
      format: `rgb`,
      control: `hue`,
      defaultValue: rgbStringFromColor(this._color),
      inline: true
    });
    return $(colorPicker);
  }
  _initElements() {
    this._colorPicker.draggable({
      handle: `#${this._colorPickerHeaderId}`
    });
    $(`#${this._colorPickerOkId}`).on("click", () => {
      this._updateColor();
      this.hide();
    });
    $(`#${this._colorPickerCancelId}`).on("click", () => {
      this.hide();
    });
    $(`#${this._colorPickerApplyId}`).on("click", () => {
      this._updateColor();
    });
  }
  _updateColor() {
    this._color.assign(colorFromRgbString(getValueAsString(`#${this._colorPickerInputId}`)));
    $(`#${this._colorPickerActiveColorSwatchId}`).css(
      "background",
      cssHexStringFromColor(this._color)
    );
  }
  show() {
    centerWindow(this._colorPickerId, this._viewer.view.getCanvasSize());
    this._colorPicker.show();
  }
  hide() {
    this._colorPicker.hide();
  }
  getColor() {
    return this._color.copy();
  }
}
export {
  ColorPicker
};
