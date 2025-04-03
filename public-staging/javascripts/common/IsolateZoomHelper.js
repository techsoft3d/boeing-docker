var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { DefaultTransitionDuration, Util } from "@hoops/web-viewer";
function _filterActiveSheetNodeIds(viewer, nodeIds) {
  const model = viewer.model;
  const activeSheetId = viewer.sheetManager.getActiveSheetId();
  if (activeSheetId !== null) {
    const sheetParent = model.getNodeParent(activeSheetId);
    const sheets = model.getNodeChildren(sheetParent);
    Util.filterInPlace(nodeIds, (id) => {
      let parentId = id;
      while (parentId !== null) {
        if (parentId === activeSheetId) {
          return true;
        } else if (sheets.indexOf(parentId) !== -1) {
          return false;
        }
        parentId = viewer.model.getNodeParent(parentId);
      }
      return true;
    });
  }
}
class IsolateZoomHelper {
  constructor(viewer) {
    __publicField(this, "_viewer");
    __publicField(this, "_noteTextManager");
    __publicField(this, "_camera", null);
    __publicField(this, "_deselectOnIsolate", true);
    __publicField(this, "_deselectOnZoom", true);
    __publicField(this, "_isolateStatus", false);
    this._viewer = viewer;
    this._noteTextManager = this._viewer.noteTextManager;
    this._viewer.setCallbacks({
      modelSwitched: () => {
        this._camera = null;
      }
    });
  }
  _setCamera(camera) {
    if (this._camera === null) {
      this._camera = camera;
    }
  }
  setDeselectOnIsolate(deselect) {
    this._deselectOnIsolate = deselect;
  }
  getIsolateStatus() {
    return this._isolateStatus;
  }
  isolateNodes(nodeIds, initiallyHiddenStayHidden = null) {
    const view = this._viewer.view;
    this._setCamera(view.getCamera());
    _filterActiveSheetNodeIds(this._viewer, nodeIds);
    const p = view.isolateNodes(
      nodeIds,
      DefaultTransitionDuration,
      !this._viewer.sheetManager.isDrawingSheetActive(),
      initiallyHiddenStayHidden
    );
    if (this._deselectOnIsolate) {
      this._viewer.selectionManager.clear();
    }
    this._isolateStatus = true;
    return p;
  }
  fitNodes(nodeIds) {
    const view = this._viewer.view;
    this._setCamera(view.getCamera());
    const p = view.fitNodes(nodeIds);
    if (this._deselectOnZoom) {
      this._viewer.selectionManager.clear();
    }
    return p;
  }
  showAll() {
    const model = this._viewer.model;
    if (this._viewer.sheetManager.isDrawingSheetActive()) {
      const sheetId = this._viewer.sheetManager.getActiveSheetId();
      if (sheetId !== null) {
        return this.isolateNodes([sheetId]);
      }
      return Promise.resolve();
    } else {
      const ps = [];
      if (model.isDrawing()) {
        const nodes3D = this._viewer.sheetManager.get3DNodes();
        ps.push(this.isolateNodes(nodes3D));
      } else
        ps.push(model.resetNodesVisibility());
      if (this._camera !== null) {
        this._viewer.view.setCamera(this._camera, DefaultTransitionDuration);
        this._camera = null;
      }
      this._isolateStatus = false;
      ps.push(this._updatePinVisibility());
      return Util.waitForAll(ps);
    }
  }
  _updatePinVisibility() {
    this._noteTextManager.setIsolateActive(this._isolateStatus);
    return this._noteTextManager.updatePinVisibility();
  }
}
export {
  IsolateZoomHelper,
  _filterActiveSheetNodeIds
};
