var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class UiDialog {
  constructor(containerId) {
    __publicField(this, "_containerId");
    __publicField(this, "_textDiv");
    __publicField(this, "_windowElement");
    __publicField(this, "_headerDiv");
    this._containerId = containerId;
    this._textDiv = UiDialog._createTextDiv();
    this._windowElement = UiDialog._createWindowElement();
    this._headerDiv = UiDialog._createHeaderDiv();
    this._initElements();
  }
  static _createWindowElement() {
    const windowElement = document.createElement("div");
    windowElement.classList.add("ui-timeout-window");
    windowElement.classList.add("desktop-ui-window");
    return windowElement;
  }
  static _createHeaderDiv() {
    const headerDiv = document.createElement("div");
    headerDiv.classList.add("desktop-ui-window-header");
    return headerDiv;
  }
  static _createTextDiv() {
    const textDiv = document.createElement("div");
    return textDiv;
  }
  _initElements() {
    const contentDiv = document.createElement("div");
    contentDiv.classList.add("desktop-ui-window-content");
    contentDiv.appendChild(this._textDiv);
    const br = document.createElement("div");
    br.classList.add("desktop-ui-window-divider");
    contentDiv.appendChild(br);
    const button = document.createElement("button");
    button.innerHTML = "Ok";
    $(button).button().on("click", () => {
      this._onOkButtonClick();
    });
    contentDiv.appendChild(button);
    this._windowElement.appendChild(this._headerDiv);
    this._windowElement.appendChild(contentDiv);
    const container = document.getElementById(this._containerId);
    if (container !== null) {
      container.appendChild(this._windowElement);
    }
  }
  _onOkButtonClick() {
    this.hide();
  }
  show() {
    $(this._windowElement).show();
  }
  hide() {
    $(this._windowElement).hide();
  }
  setText(text) {
    $(this._textDiv).empty();
    this._textDiv.appendChild(document.createTextNode(text));
  }
  setTitle(title) {
    $(this._headerDiv).empty();
    this._headerDiv.appendChild(document.createTextNode(title));
  }
}
export {
  UiDialog
};
