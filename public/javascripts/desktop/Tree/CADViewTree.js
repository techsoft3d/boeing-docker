var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { OperatorId } from "@hoops/web-viewer";
import { ViewTree } from "./ViewTree.js";
import { Tree } from "./types.js";
import { TreeSeparator } from "./util.js";
class CadViewTree extends ViewTree {
  constructor(viewer, elementId, iScroll, cuttingController) {
    super(viewer, elementId, iScroll);
    __publicField(this, "_annotationViewsString", "annotationViews");
    __publicField(this, "_annotationViewsLabel", "Annotation Views");
    __publicField(this, "_combineStateViewsString", "combineStateViews");
    __publicField(this, "_combineStateViewsLabel", "Combine State Views");
    __publicField(this, "_viewFolderCreated", false);
    __publicField(this, "_lastSelectedhtmlId", null);
    __publicField(this, "_cadViewIds", /* @__PURE__ */ new Set());
    __publicField(this, "_cuttingController");
    this._tree.setCreateVisibilityItems(false);
    this._initEvents();
    this._cuttingController = cuttingController;
  }
  _initEvents() {
    this._viewer.setCallbacks({
      firstModelLoaded: async (_modelRootIds, isHwf) => {
        if (!isHwf) {
          this._updateCadViews();
        }
      },
      subtreeLoaded: () => {
        this._updateCadViews();
      },
      configurationActivated: () => {
        this._tree.clear();
        this._cadViewIds.clear();
        this._viewFolderCreated = false;
        this._updateCadViews();
      },
      modelSwitched: () => {
        this._modelSwitched();
      },
      sheetActivated: () => {
        if (this._viewer.model.isDrawing()) {
          if (this._lastSelectedhtmlId != null) {
            const thisElement = document.getElementById(this._lastSelectedhtmlId);
            if (thisElement !== null) {
              thisElement.classList.remove("selected");
            }
          }
          this.hideTab();
        }
      },
      sheetDeactivated: () => {
        if (this._viewer.model.isDrawing()) {
          this.showTab();
        }
      },
      cadViewCreated: (cadViewId, cadViewName) => {
        const newCadView = /* @__PURE__ */ new Map();
        newCadView.set(cadViewId, cadViewName);
        this._addCadViews(newCadView);
      }
    });
    this._tree.registerCallback("selectItem", async (id) => {
      await this._onTreeSelectItem(id);
    });
  }
  _modelSwitched() {
    this._tree.clear();
    this._cadViewIds.clear();
    this._viewFolderCreated = false;
    this._updateCadViews();
  }
  _updateCadViews() {
    const cadViews = this._viewer.model.getCadViewMap();
    this._addCadViews(cadViews);
  }
  _addCadViews(cadViews) {
    this._createCadViewNodes(cadViews);
    if (cadViews.size <= 0) {
      this.hideTab();
    } else {
      this.showTab();
    }
    this._tree.expandInitialNodes(this._internalId);
    this._tree.expandInitialNodes(this._internalId + this._annotationViewsString);
    this._tree.expandInitialNodes(this._internalId + this._combineStateViewsString);
  }
  _allowView(viewNodeId) {
    const activeConfig = this._viewer.model.getActiveCadConfiguration();
    const nodeConfig = this._viewer.model.getCadViewConfiguration(viewNodeId);
    return activeConfig === null || nodeConfig === null || nodeConfig === activeConfig;
  }
  _createCadViewNodes(cadViews) {
    if (cadViews.size === 0) {
      return;
    }
    if (!this._viewFolderCreated) {
      this._tree.appendTopLevelElement("Views", this._internalId, "viewfolder", true);
      this._viewFolderCreated = true;
    }
    const model = this._viewer.model;
    const enableShatteredModelUiViews = this._viewer.getCreationParameters().enableShatteredModelUiViews === true;
    const allowView = (nodeId) => {
      return this._allowView(nodeId) && (enableShatteredModelUiViews || !model.isWithinExternalModel(nodeId));
    };
    const regularViews = [];
    const annotationViews = [];
    const combineStateViews = [];
    cadViews.forEach((name, nodeId) => {
      if (!this._cadViewIds.has(nodeId) && allowView(nodeId)) {
        this._cadViewIds.add(nodeId);
        if (model.isAnnotationView(nodeId)) {
          annotationViews.push({ name, nodeId });
        } else if (model.isCombineStateView(nodeId)) {
          combineStateViews.push({ name, nodeId });
        } else {
          regularViews.push({ name, nodeId });
        }
      }
    });
    regularViews.forEach((view) => {
      this._tree.addChild(
        view.name,
        this._cadViewId(view.nodeId),
        this._internalId,
        "view",
        false,
        Tree.CadView
      );
    });
    if (annotationViews.length > 0) {
      this._tree.addChild(
        this._annotationViewsLabel,
        this._internalId + this._annotationViewsString,
        this._internalId,
        "viewfolder",
        true,
        Tree.CadView,
        true,
        false,
        this._annotationViewsLabel
      );
      annotationViews.forEach((view) => {
        const parsedValue = view.name.split("# Annotation View")[0];
        this._tree.addChild(
          parsedValue,
          this._cadViewId(view.nodeId),
          this._internalId + this._annotationViewsString,
          "view",
          false,
          Tree.CadView
        );
      });
    }
    if (combineStateViews.length > 0) {
      this._tree.addChild(
        this._combineStateViewsLabel,
        this._internalId + this._combineStateViewsString,
        this._internalId,
        "viewfolder",
        true,
        Tree.CadView,
        true,
        false,
        this._combineStateViewsLabel
      );
      combineStateViews.forEach((view) => {
        this._tree.addChild(
          view.name,
          this._cadViewId(view.nodeId),
          this._internalId + this._combineStateViewsString,
          "view",
          false,
          Tree.CadView
        );
      });
    }
  }
  async _onTreeSelectItem(htmlId) {
    const idParts = this._splitHtmlId(htmlId);
    if (idParts[0] === this._internalId) {
      const handleOperator = this._viewer.operatorManager.getOperator(OperatorId.Handle);
      await handleOperator.removeHandles();
      if (this._cuttingController) {
        await this._cuttingController.pause();
      }
      await this._viewer.model.activateCadView(parseInt(idParts[1], 10));
      if (this._cuttingController) {
        setTimeout(() => this._cuttingController.resume(), 300);
      }
    }
    const thisElement = document.getElementById(htmlId);
    if (thisElement !== null) {
      if (thisElement.tagName === "LI" && htmlId !== this._internalId && htmlId !== this._internalId + this._annotationViewsString && htmlId !== this._internalId + this._combineStateViewsString) {
        thisElement.classList.add("selected");
        this._lastSelectedhtmlId = htmlId;
      } else {
        thisElement.classList.remove("selected");
      }
    }
  }
  _cadViewId(id) {
    return this._internalId + TreeSeparator + id;
  }
}
export {
  CadViewTree
};
