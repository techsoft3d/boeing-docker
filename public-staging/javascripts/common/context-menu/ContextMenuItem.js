var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class ContextMenuItem {
  constructor(action, element) {
    __publicField(this, "action");
    __publicField(this, "element");
    this.action = action;
    this.element = element;
  }
  setEnabled(enabled) {
    if (enabled)
      $(this.element).removeClass("disabled");
    else
      $(this.element).addClass("disabled");
  }
  setText(text) {
    this.element.innerHTML = text;
  }
  show() {
    $(this.element).show();
  }
  hide() {
    $(this.element).hide();
  }
}
export {
  ContextMenuItem
};
