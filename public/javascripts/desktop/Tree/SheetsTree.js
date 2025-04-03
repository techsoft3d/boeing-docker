var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { Point3, ViewOrientation } from "@hoops/web-viewer";
import { ViewTree } from "./ViewTree.js";
import { TreeSeparator } from "./util.js";
class SheetsTree extends ViewTree {
  constructor(viewer, elementId, iScroll) {
    super(viewer, elementId, iScroll);
    __publicField(this, "_currentSheetId", null);
    __publicField(this, "_3dSheetId", `${this._internalId}${TreeSeparator}3D`);
    this._tree.setCreateVisibilityItems(false);
    this._initEvents();
  }
  _initEvents() {
    const onNewModel = () => {
      this._onNewModel();
    };
    this._viewer.setCallbacks({
      assemblyTreeReady: onNewModel,
      firstModelLoaded: onNewModel,
      modelSwitched: onNewModel,
      sheetActivated: (sheetId) => {
        this._onSheetActivated(sheetId);
      },
      sheetDeactivated: () => {
        this._onSheetDeactivated();
      }
    });
    this._tree.registerCallback("selectItem", async (id) => {
      await this._onTreeSelectItem(id);
    });
  }
  _setCurrentSheetId(htmlId) {
    const $currentSheetNode = $(`#${this._currentSheetId}`);
    if ($currentSheetNode !== null) {
      $currentSheetNode.removeClass("selected-sheet");
    }
    const $sheetNode = $(`#${htmlId}`);
    if ($sheetNode !== null) {
      $sheetNode.addClass("selected-sheet");
    }
    this._currentSheetId = htmlId;
  }
  _onNewModel() {
    this._tree.clear();
    if (this._viewer.model.isDrawing()) {
      const model = this._viewer.model;
      const sheetNodeIds = this._viewer.sheetManager.getSheetIds();
      for (const sheetNodeId of sheetNodeIds) {
        const name = model.getNodeName(sheetNodeId);
        const sheetElemId = this._sheetTreeId(sheetNodeId);
        this._tree.appendTopLevelElement(name, sheetElemId, "sheet", false);
      }
      if (this._viewer.sheetManager.get3DNodes().length > 0) {
        this._tree.appendTopLevelElement("3D Model", this._3dSheetId, "sheet", false, false, false);
        this._currentSheetId = this._3dSheetId;
      }
      this.showTab();
    } else {
      this.hideTab();
    }
  }
  _onSheetActivated(sheetId) {
    this._setCurrentSheetId(this._sheetTreeId(sheetId));
  }
  _onSheetDeactivated() {
    this._setCurrentSheetId(this._3dSheetId);
  }
  async _onTreeSelectItem(htmlId) {
    if (htmlId === this._3dSheetId) {
      return this._viewer.sheetManager.deactivateSheets();
    } else {
      const idParts = this._splitHtmlId(htmlId);
      const id = parseInt(idParts[1], 10);
      if (this._currentSheetId === this._3dSheetId) {
        this._viewer.model.setViewAxes(new Point3(0, 0, 1), new Point3(0, 1, 0));
        await this._viewer.setViewOrientation(ViewOrientation.Front, 0);
      }
      return this._viewer.sheetManager.setActiveSheetId(id);
    }
  }
  _sheetTreeId(sheetId) {
    return `${this._internalId}${TreeSeparator}${sheetId}`;
  }
}
export {
  SheetsTree
};
