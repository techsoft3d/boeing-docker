var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { BranchVisibility } from "@hoops/web-viewer";
import { TreeSeparator } from "./util.js";
class VisibilityControl {
  constructor(viewer) {
    __publicField(this, "_viewer");
    __publicField(this, "_fullHiddenParentIds", []);
    __publicField(this, "_partialHiddenParentIds", []);
    __publicField(this, "_assemblyTreeReadyOccurred", false);
    this._viewer = viewer;
    const updateVisibilityState = () => {
      this.updateModelTreeVisibilityState();
      return Promise.resolve();
    };
    this._viewer.setCallbacks({
      _assemblyTreeReady: () => {
        this._assemblyTreeReadyOccurred = true;
        return updateVisibilityState();
      },
      firstModelLoaded: updateVisibilityState
    });
  }
  _clearStyles() {
    for (const id of this._fullHiddenParentIds) {
      this._removeVisibilityHiddenClass(id, "partHidden");
    }
    this._fullHiddenParentIds.length = 0;
    for (const id of this._partialHiddenParentIds) {
      this._removeVisibilityHiddenClass(id, "partialHidden");
    }
    this._partialHiddenParentIds.length = 0;
  }
  _applyStyles() {
    for (const id of this._fullHiddenParentIds) {
      this._addVisibilityHiddenClass(id, "partHidden");
    }
    for (const id of this._partialHiddenParentIds) {
      this._addVisibilityHiddenClass(id, "partialHidden");
    }
  }
  updateModelTreeVisibilityState() {
    if (this._assemblyTreeReadyOccurred) {
      this._clearStyles();
      const model = this._viewer.model;
      const nodeQueue = [model.getAbsoluteRootNode()];
      for (const nodeId of nodeQueue) {
        const nodeStatus = model.getBranchVisibility(nodeId);
        if (nodeStatus === BranchVisibility.Hidden) {
          this._fullHiddenParentIds.push(nodeId);
        } else if (nodeStatus === BranchVisibility.Mixed) {
          this._partialHiddenParentIds.push(nodeId);
          const nodeChildren = model.getNodeChildren(nodeId);
          for (const child of nodeChildren) {
            nodeQueue.push(child);
          }
        }
      }
      this._applyStyles();
    }
  }
  _getVisibilityItem(nodeId) {
    return $(`#visibility${TreeSeparator}part${TreeSeparator}${nodeId}`);
  }
  _addVisibilityHiddenClass(nodeId, className) {
    this._getVisibilityItem(nodeId).addClass(className);
  }
  _removeVisibilityHiddenClass(nodeId, className) {
    this._getVisibilityItem(nodeId).removeClass(className);
  }
}
export {
  VisibilityControl
};
