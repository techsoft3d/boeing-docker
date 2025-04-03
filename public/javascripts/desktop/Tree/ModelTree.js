var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { Util, NodeType, SelectionMode } from "@hoops/web-viewer";
import { ViewTree } from "./ViewTree.js";
import { TreeSeparator } from "./util.js";
import { Tree } from "./types.js";
class ModelTree extends ViewTree {
  constructor(viewer, elementId, iScroll) {
    super(viewer, elementId, iScroll);
    __publicField(this, "_lastModelRoot", null);
    __publicField(this, "_startedWithoutModelStructure", false);
    __publicField(this, "_partSelectionEnabled", true);
    __publicField(this, "_currentSheetId", null);
    __publicField(this, "_currentConfigurationId", null);
    __publicField(this, "_measurementFolderId", "measurementitems");
    __publicField(this, "_updateVisibilityStateTimer", new Util.Timer());
    this._initEvents();
  }
  freezeExpansion(freeze) {
    this._tree.freezeExpansion(freeze);
  }
  modelStructurePresent() {
    const model = this._viewer.model;
    return model.getNodeName(model.getAbsoluteRootNode()) !== "No product structure";
  }
  enablePartSelection(enable) {
    this._partSelectionEnabled = enable;
  }
  _initEvents() {
    const reset = () => {
      this._reset();
    };
    this._viewer.setCallbacks({
      assemblyTreeReady: () => {
        this._onNewModel();
      },
      firstModelLoaded: reset,
      hwfParseComplete: reset,
      modelSwitched: reset,
      selectionArray: (events) => {
        this._onPartSelection(events);
      },
      visibilityChanged: () => {
        this._tree.getVisibilityControl().updateModelTreeVisibilityState();
      },
      viewCreated: (view) => {
        this._onNewView(view);
      },
      viewLoaded: (view) => {
        this._onNewView(view);
      },
      subtreeLoaded: (nodeIdArray) => {
        this._onSubtreeLoaded(nodeIdArray);
        this._tree.getVisibilityControl().updateModelTreeVisibilityState();
      },
      subtreeDeleted: (nodeIdArray) => {
        this._onSubtreeDeleted(nodeIdArray);
      },
      modelSwitchStart: () => {
        this._tree.clear();
      },
      measurementCreated: (measurement) => {
        this._onNewMeasurement(measurement);
      },
      measurementLoaded: (measurement) => {
        this._onNewMeasurement(measurement);
      },
      measurementDeleted: (measurement) => {
        this._onDeleteMeasurement(measurement);
      },
      measurementShown: () => {
        this._tree.updateMeasurementVisibilityIcons();
      },
      measurementHidden: () => {
        this._tree.updateMeasurementVisibilityIcons();
      },
      sheetActivated: (sheetid) => {
        if (sheetid !== this._currentSheetId) {
          this._currentSheetId = sheetid;
          this._updateModelTree();
        }
      },
      sheetDeactivated: () => {
        this._reset();
      },
      configurationActivated: (configurationId) => {
        this._currentConfigurationId = configurationId;
        this._updateModelTree();
      }
    });
    this._tree.registerCallback("loadChildren", (htmlId) => {
      this._loadNodeChildren(htmlId);
    });
    this._tree.registerCallback(
      "selectItem",
      async (htmlId, selectionMode) => {
        await this._onTreeSelectItem(htmlId, selectionMode);
      }
    );
  }
  _reset() {
    this._tree.clear();
    this._currentSheetId = null;
    this._updateModelTree();
  }
  _updateModelTree() {
    this._tree.clear();
    const model = this._viewer.model;
    const rootId = model.getAbsoluteRootNode();
    const name = model.getNodeName(rootId);
    if (this._currentSheetId) {
      this._tree.appendTopLevelElement(
        name,
        this._partId(rootId),
        "modelroot",
        model.getNodeChildren(rootId).length > 0,
        false,
        true
      );
      this._tree.addChild(
        model.getNodeName(this._currentSheetId),
        this._partId(this._currentSheetId),
        this._partId(rootId),
        "part",
        true,
        Tree.Model
      );
    } else {
      this._lastModelRoot = this._tree.appendTopLevelElement(
        name,
        this._partId(rootId),
        "modelroot",
        model.getNodeChildren(rootId).length > 0
      );
    }
    this._tree.expandInitialNodes(this._partId(rootId));
    this._refreshMarkupViews();
  }
  _onNewModel() {
    this.showTab();
    this._startedWithoutModelStructure = !this.modelStructurePresent();
    this._updateModelTree();
  }
  _createMarkupViewFolderIfNecessary() {
    const $markupViewFolder = $("#markupviews");
    if ($markupViewFolder.length === 0)
      this._tree.appendTopLevelElement("Markup Views", "markupviews", "viewfolder", false);
  }
  _createMeasurementFolderIfNecessary() {
    const $measurementsFolder = $(`#${this._measurementFolderId}`);
    if ($measurementsFolder.length === 0)
      this._tree.appendTopLevelElement(
        "Measurements",
        this._measurementFolderId,
        "measurement",
        false
      );
  }
  _parentChildrenLoaded(parent) {
    const parentIdString = this._partId(parent);
    return this._tree.childrenAreLoaded(parentIdString);
  }
  _onSubtreeLoaded(nodeIds) {
    const model = this._viewer.model;
    for (let nodeId of nodeIds) {
      if (model.getOutOfHierarchy(nodeId)) {
        continue;
      }
      let parentNodeId = model.getNodeParent(nodeId);
      if (parentNodeId === null) {
        console.assert(this._lastModelRoot !== null);
        this._lastModelRoot = this._tree._insertNodeAfter(
          model.getNodeName(nodeId),
          this._partId(nodeId),
          "modelroot",
          this._lastModelRoot,
          true
        );
      } else {
        const initialParent = parentNodeId;
        do {
          if (this._parentChildrenLoaded(parentNodeId)) {
            if (initialParent === parentNodeId) {
              this._tree.addChild(
                model.getNodeName(nodeId),
                this._partId(nodeId),
                this._partId(parentNodeId),
                "assembly",
                true,
                Tree.Model
              );
            }
            this._tree.preloadChildrenIfNecessary(this._partId(nodeId));
            break;
          }
          nodeId = parentNodeId;
          parentNodeId = model.getNodeParent(nodeId);
        } while (parentNodeId !== null);
      }
    }
    if (this._startedWithoutModelStructure) {
      const treeRoot = this._tree.getRoot();
      if (treeRoot.firstChild !== null) {
        treeRoot.removeChild(treeRoot.firstChild);
      }
      const visibilityRoot = this._tree.getPartVisibilityRoot();
      if (visibilityRoot.firstChild !== null) {
        visibilityRoot.removeChild(visibilityRoot.firstChild);
      }
    }
  }
  _onSubtreeDeleted(nodeIds) {
    for (const nodeId of nodeIds) {
      this._tree.deleteNode(this._partId(nodeId));
    }
  }
  _buildTreePathForNode(nodeId) {
    const model = this._viewer.model;
    const parents = [];
    let parentId = model.getNodeParent(nodeId);
    while (parentId !== null) {
      if (this._viewer.sheetManager.isDrawingSheetActive() && this._currentSheetId !== null && (parentId === this._currentSheetId || nodeId === this._currentSheetId)) {
        break;
      }
      parents.push(parentId);
      parentId = model.getNodeParent(parentId);
    }
    parents.reverse();
    return parents;
  }
  _expandCorrectContainerForNodeId(nodeId) {
    const model = this._viewer.model;
    const parentId = model.getNodeParent(nodeId);
    if (parentId === null) {
      return;
    }
    const nodes = model.getNodeChildren(parentId);
    const index = nodes.indexOf(nodeId);
    if (index >= 0) {
      const containerIndex = Math.floor(index / this._maxNodeChildrenSize);
      this._tree.expandChildren(this._containerId(parentId, containerIndex));
    }
  }
  _expandPmiFolder(nodeId) {
    const model = this._viewer.model;
    const parentId = model.getNodeParent(nodeId);
    if (parentId === null) {
      return;
    }
    this._tree.expandChildren(this._pmiFolderId(parentId));
  }
  _isInsideContainer(nodeId) {
    const parentId = this._viewer.model.getNodeParent(nodeId);
    if (parentId === null) {
      return false;
    }
    const container0HtmlId = this._containerId(parentId, 0);
    const containerElement = $(`#${container0HtmlId}`);
    return containerElement.length > 0;
  }
  _isInsidePmiFolder(nodeId) {
    const parentId = this._viewer.model.getNodeParent(nodeId);
    if (parentId === null) {
      return false;
    }
    const folderId = this._pmiFolderId(parentId);
    const folderElement = $(`#${folderId}`);
    return folderElement.length > 0;
  }
  _expandPart(nodeId) {
    if (this._viewer.model.isNodeLoaded(nodeId)) {
      const ancestorIds = this._buildTreePathForNode(nodeId);
      for (const ancestorId of ancestorIds) {
        if (this._isInsideContainer(ancestorId)) {
          this._expandCorrectContainerForNodeId(ancestorId);
        }
        const $node = $(`#${this._partId(ancestorId)}`);
        const nodeIdAttr = $node.attr("id");
        if (nodeIdAttr !== void 0) {
          this._tree.expandChildren(nodeIdAttr);
        }
      }
      if (this._isInsideContainer(nodeId)) {
        this._expandCorrectContainerForNodeId(nodeId);
      }
      if (this._isInsidePmiFolder(nodeId)) {
        this._expandPmiFolder(nodeId);
      }
      this._tree.selectItem(this._partId(nodeId), false);
    }
  }
  _onPartSelection(events) {
    if (!this._partSelectionEnabled) {
      return;
    }
    for (const event of events) {
      const nodeId = event.getSelection().getNodeId();
      if (nodeId === null) {
        this._tree.selectItem(null, false);
      } else {
        this._expandPart(nodeId);
      }
    }
    if (events.length === 0) {
      this._tree.updateSelection(null);
    }
  }
  _createContainerNodes(partId, childNodes) {
    let containerStartIndex = 1;
    let containerEndIndex = this._maxNodeChildrenSize;
    let containerCount = 0;
    do {
      const rangeEnd = Math.min(containerEndIndex, childNodes.length);
      const name = `Child Nodes ${containerStartIndex} - ${rangeEnd}`;
      this._tree.addChild(
        name,
        this._containerId(partId, containerCount),
        this._partId(partId),
        "container",
        true,
        Tree.Model
      );
      containerStartIndex += this._maxNodeChildrenSize;
      ++containerCount;
      if (containerEndIndex >= childNodes.length) {
        return;
      }
      containerEndIndex += this._maxNodeChildrenSize;
    } while (containerEndIndex >= childNodes.length);
  }
  _loadAssemblyNodeChildren(nodeId) {
    const model = this._viewer.model;
    const children = model.getNodeChildren(nodeId);
    if (children.length > this._maxNodeChildrenSize) {
      this._createContainerNodes(nodeId, children);
    } else {
      const partId = this._partId(nodeId);
      this._processNodeChildren(children, partId);
    }
  }
  _loadContainerChildren(containerId) {
    const model = this._viewer.model;
    const idParts = this._splitHtmlId(containerId);
    const containerData = this._splitContainerId(idParts[1]);
    const children = model.getNodeChildren(parseInt(containerData[0], 10));
    const startIndex = this._maxNodeChildrenSize * parseInt(containerData[1], 10);
    const childrenSlice = children.slice(startIndex, startIndex + this._maxNodeChildrenSize);
    this._processNodeChildren(childrenSlice, containerId);
  }
  _processNodeChildren(children, parentId) {
    const model = this._viewer.model;
    let pmiFolder = null;
    for (const childId of children) {
      const name = model.getNodeName(childId);
      let currParentId = parentId;
      let itemType = "assembly";
      let ignoreNode = false;
      if (this._currentConfigurationId !== null && childId in model.getCadConfigurations() && childId !== this._currentConfigurationId) {
        ignoreNode = true;
      }
      switch (model.getNodeType(childId)) {
        case NodeType.Body:
        case NodeType.BodyInstance:
          itemType = "body";
          break;
        case NodeType.Pmi:
          if (pmiFolder === null) {
            const parentNodeId = this._viewer.model.getNodeParent(childId);
            if (parentNodeId !== null) {
              pmiFolder = this._tree.addChild(
                "PMI",
                this._pmiFolderId(parentNodeId),
                parentId,
                "modelroot",
                true,
                Tree.Model,
                true,
                true
              );
            }
          }
          if (pmiFolder !== null) {
            currParentId = pmiFolder.id;
            itemType = "assembly";
          }
          break;
        case NodeType.DrawingSheet:
          if (!this._viewer.sheetManager.isDrawingSheetActive()) {
            ignoreNode = true;
          }
          break;
      }
      if (!ignoreNode) {
        this._tree.addChild(
          name,
          this._partId(childId),
          currParentId,
          itemType,
          model.getNodeChildren(childId).length > 0,
          Tree.Model
        );
      }
    }
    if (children.length > 0) {
      this._updateVisibilityStateTimer.set(50, () => {
        this._tree.getVisibilityControl().updateModelTreeVisibilityState();
      });
    }
  }
  _loadNodeChildren(htmlId) {
    const idParts = this._splitHtmlId(htmlId);
    const kind = idParts[idParts[0] === "" ? 1 : 0];
    switch (kind) {
      case "part":
        this._loadAssemblyNodeChildren(parseInt(idParts[1], 10));
        break;
      case "container":
        this._loadContainerChildren(htmlId);
        break;
      case "markupviews":
      case "measurementitems":
      case "pmipart":
      case "pmipartfolder":
        break;
      default:
        console.assert(false, kind);
        break;
    }
  }
  async _onTreeSelectItem(htmlId, selectionMode = SelectionMode.Set) {
    const thisElement = document.getElementById(htmlId);
    if (thisElement === null) {
      return;
    }
    if (thisElement.tagName === "LI" && htmlId !== "markupviews") {
      thisElement.classList.add("selected");
    } else {
      const viewTree = document.getElementById("markupviews");
      if (viewTree !== null) {
        viewTree.classList.remove("selected");
      }
    }
    if (htmlId.lastIndexOf("pmi", 0) === 0 && thisElement.classList.contains("ui-modeltree-item")) {
      thisElement.classList.remove("selected");
    }
    const idParts = this._splitHtmlId(htmlId);
    switch (idParts[0]) {
      case "part":
        this._viewer.selectPart(parseInt(idParts[1], 10), selectionMode);
        break;
      case "markupview":
        await this._viewer.markupManager.activateMarkupViewWithPromise(idParts[1]);
        break;
      case "container":
        this._onContainerClick(idParts[1]);
        break;
    }
  }
  _onContainerClick(_containerId) {
  }
  _onNewView(view) {
    this._createMarkupViewFolderIfNecessary();
    this._addMarkupView(view);
  }
  _refreshMarkupViews() {
    const markupManager = this._viewer.markupManager;
    const viewKeys = markupManager.getMarkupViewKeys();
    for (const viewKey of viewKeys) {
      const view = markupManager.getMarkupView(viewKey);
      if (view !== null) {
        this._addMarkupView(view);
      }
    }
  }
  _addMarkupView(view) {
    this._createMarkupViewFolderIfNecessary();
    const viewId = this._viewId(view.getUniqueId());
    this._tree.addChild(view.getName(), viewId, "markupviews", "view", false, Tree.Model);
  }
  _onNewMeasurement(measurement) {
    this._createMeasurementFolderIfNecessary();
    const measurementId = this._measurementId(measurement._getId());
    this._tree.addChild(
      measurement.getName(),
      measurementId,
      this._measurementFolderId,
      "measurement",
      false,
      Tree.Model
    );
    this._updateMeasurementsFolderVisibility();
    this._tree.updateMeasurementVisibilityIcons();
  }
  _onDeleteMeasurement(measurement) {
    const measurementId = this._measurementId(measurement._getId());
    this._tree.deleteNode(measurementId);
    this._tree.deleteNode(`visibility${TreeSeparator}${measurementId}`);
    this._updateMeasurementsFolderVisibility();
  }
  _updateMeasurementsFolderVisibility() {
    const measurements = this._viewer.measureManager.getAllMeasurements();
    const measurementItems = document.getElementById(this._measurementFolderId);
    if (measurementItems !== null) {
      measurementItems.style["display"] = measurements.length ? "inherit" : "none";
    }
    const measurementVisibilityItems = document.getElementById(
      `visibility${TreeSeparator}${this._measurementFolderId}`
    );
    if (measurementVisibilityItems !== null) {
      measurementVisibilityItems.style["display"] = measurements.length ? "inherit" : "none";
    }
  }
  _measurementId(measurementGuid) {
    return `measurement${TreeSeparator}${measurementGuid}`;
  }
  _partId(nodeId) {
    return `part${TreeSeparator}${nodeId}`;
  }
  _pmiFolderId(nodeId) {
    return `pmipartfolder${TreeSeparator}${nodeId}`;
  }
  _viewId(viewGuid) {
    return `markupview${TreeSeparator}${viewGuid}`;
  }
  _containerId(partId, containerIndex) {
    console.assert(containerIndex >= 0);
    return `container${TreeSeparator}${partId}-${containerIndex}`;
  }
  _splitContainerId(htmlId) {
    return this._splitHtmlIdParts(htmlId, "-");
  }
  updateSelection(items) {
    this._tree.updateSelection(items);
  }
}
export {
  ModelTree
};
