var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { TreeControl } from "./TreeControl.js";
import { TreeSeparator } from "./util.js";
class ViewTree {
  constructor(viewer, elementId, iScroll) {
    __publicField(this, "_tree");
    __publicField(this, "_viewer");
    __publicField(this, "_internalId");
    __publicField(this, "_maxNodeChildrenSize", 300);
    this._tree = new TreeControl(elementId, viewer, TreeSeparator, iScroll);
    this._internalId = `${elementId}Id`;
    this._viewer = viewer;
  }
  getElementId() {
    return this._tree.getElementId();
  }
  registerCallback(name, func) {
    this._tree.registerCallback(name, func);
  }
  _splitHtmlId(htmlId) {
    return this._splitHtmlIdParts(htmlId, TreeSeparator);
  }
  _splitHtmlIdParts(htmlId, separator) {
    const splitPos = htmlId.lastIndexOf(separator);
    if (splitPos === -1) {
      return ["", htmlId];
    }
    return [htmlId.substring(0, splitPos), htmlId.substring(splitPos + separator.length)];
  }
  hideTab() {
    $(`#${this.getElementId()}Tab`).hide();
  }
  showTab() {
    $(`#${this.getElementId()}Tab`).show();
  }
  /** @hidden */
  _getTreeControl() {
    return this._tree;
  }
}
__publicField(ViewTree, "visibilityPrefix", "visibility");
export {
  ViewTree
};
