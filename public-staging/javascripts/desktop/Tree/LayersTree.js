var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { SelectionMode, FileType, NodeType } from "@hoops/web-viewer";
import { ViewTree } from "./ViewTree.js";
import { TreeGetPartId, TreeGetLayerName, TreeGetLayerId, TreeLayerPrefix, TreeSeparator, TreeLayerPartPrefix, TreeLayerPartContainerPrefix } from "./util.js";
import { Tree } from "./types.js";
let TreeLayerIdCount = 0;
function createLayerId() {
  return `${TreeLayerPrefix}${TreeSeparator}${++TreeLayerIdCount}`;
}
function createContainerId() {
  const prefix = TreeLayerPartContainerPrefix;
  return `${prefix}${TreeSeparator}${++TreeLayerIdCount}`;
}
function createPartId(nodeId) {
  return `${TreeLayerPartPrefix}${TreeSeparator}${nodeId}`;
}
const _LayersTree = class extends ViewTree {
  // Map Layer HTML IDs to it's contained containers
  constructor(viewer, elementId, iScroll) {
    super(viewer, elementId, iScroll);
    __publicField(this, "_layerNames", []);
    __publicField(this, "_layerParts", /* @__PURE__ */ new Set());
    this._initEvents();
  }
  _initEvents() {
    const onNewModel = () => {
      this._onNewModel();
    };
    this._viewer.setCallbacks({
      firstModelLoaded: onNewModel,
      modelSwitched: onNewModel,
      subtreeLoaded: onNewModel,
      selectionArray: (events) => {
        if (this._layerNames.length === 0) {
          return;
        }
        this._tree.updateSelection(events);
        for (const event of events) {
          const nodeId = event.getSelection().getNodeId();
          if (nodeId !== null) {
            const childNodes = this._viewer.model.getNodeChildren(nodeId);
            for (const childNode of childNodes) {
              this._expandPart(childNode);
            }
            this._expandPart(nodeId);
          }
        }
      },
      visibilityChanged: () => {
        this._tree.updateLayersVisibilityIcons();
      }
    });
    this._tree.registerCallback("selectItem", (htmlId, selectionMode) => {
      this._onTreeSelectItem(htmlId, selectionMode);
    });
    this._tree.registerCallback("loadChildren", (htmlId) => {
      this._loadNodeChildren(htmlId);
    });
  }
  _onTreeSelectItem(htmlId, selectionMode = SelectionMode.Set) {
    const thisElement = document.getElementById(htmlId);
    if (thisElement === null) {
      return;
    }
    const idParts = this._splitHtmlId(htmlId);
    switch (idParts[0]) {
      case "layerpart":
        this._selectLayerPart(htmlId, selectionMode);
        break;
      case "layer":
        this._selectLayer(htmlId, selectionMode);
        break;
    }
  }
  _selectLayerPart(layerPartId, selectionMode) {
    const partId = TreeGetPartId(layerPartId);
    if (partId !== null) {
      this._viewer.selectPart(partId, selectionMode);
    }
  }
  _selectLayer(layerId, selectionMode) {
    const layerName = TreeGetLayerName(layerId);
    if (layerName !== null) {
      this._viewer.selectionManager.selectLayer(layerName, selectionMode);
    }
  }
  _onNewModel() {
    const model = this._viewer.model;
    this._tree.clear();
    this._layerParts.clear();
    this._layerNames = model.getUniqueLayerNames().sort();
    this._layerNames = this._layerNames.filter((layerName) => {
      const layerHtmlId = createLayerId();
      _LayersTree._layerIdMap.set(layerHtmlId, layerName);
      _LayersTree._idLayerMap.set(layerName, layerHtmlId);
      const layerIds = model.getLayerIdsFromName(layerName);
      if (layerIds !== null && layerIds.length > 0) {
        this._tree.appendTopLevelElement(layerName, layerHtmlId, "assembly", true, false);
        return true;
      } else {
        return false;
      }
    });
    if (this._layerNames.length > 0) {
      this.showTab();
    } else {
      this.hideTab();
    }
  }
  _loadNodeChildren(htmlId) {
    const layerName = TreeGetLayerName(htmlId);
    if (layerName === null) {
      return;
    }
    const layerHtmlId = TreeGetLayerId(layerName);
    if (layerHtmlId === null) {
      return;
    }
    const nodeIds = this._viewer.model.getNodesFromLayerName(layerName, true);
    if (nodeIds === null) {
      return;
    }
    if (nodeIds.length < this._maxNodeChildrenSize) {
      this._addLayerParts(layerHtmlId, nodeIds);
    } else {
      this._addLayerPartContainers(layerHtmlId, nodeIds);
    }
  }
  _addLayerParts(parentHtmlId, nodeIds) {
    const model = this._viewer.model;
    const isDrawing = model.isDrawing();
    nodeIds.forEach((nodeId) => {
      const nodeType = model.getNodeType(nodeId);
      const fileType = model.getModelFileTypeFromNode(nodeId);
      if (!isDrawing && fileType !== FileType.Dwg && nodeType === NodeType.BodyInstance) {
        const parentId = model.getNodeParent(nodeId);
        if (parentId !== null) {
          nodeId = parentId;
        }
      }
      const name = model.getNodeName(nodeId);
      const partHtmlId = createPartId(nodeId);
      _LayersTree._layerPartIdMap.set(partHtmlId, nodeId);
      _LayersTree._idLayerPartMap.set(nodeId, partHtmlId);
      if (!this._layerParts.has(nodeId)) {
        this._layerParts.add(nodeId);
        this._tree.addChild(name, partHtmlId, parentHtmlId, "assembly", false, Tree.Layers);
      }
    });
  }
  _addLayerPartContainers(parentHtmlId, nodeIds) {
    const containerCount = Math.ceil(nodeIds.length / this._maxNodeChildrenSize);
    const containerIds = [];
    for (let i = 0; i < containerCount; ++i) {
      const startIndex = i * this._maxNodeChildrenSize;
      const rangeEnd = Math.min(startIndex + this._maxNodeChildrenSize, nodeIds.length);
      const name = `Child Nodes ${startIndex} - ${rangeEnd}`;
      const containerId = createContainerId();
      containerIds.push(containerId);
      this._tree.addChild(name, containerId, parentHtmlId, "container", true, Tree.Layers);
      this._addLayerParts(containerId, nodeIds.slice(startIndex, rangeEnd));
    }
    _LayersTree._layerContainersMap.set(parentHtmlId, containerIds);
  }
  _expandPart(nodeId) {
    if (this._viewer.model.isNodeLoaded(nodeId)) {
      const layerId = this._viewer.model.getNodeLayerId(nodeId);
      if (layerId === null) {
        return;
      }
      const layerName = this._viewer.model.getLayerName(layerId);
      if (layerName === null) {
        return;
      }
      const layerHtmlId = TreeGetLayerId(layerName);
      if (layerHtmlId === null) {
        return;
      }
      const layerNodes = this._viewer.model.getNodesFromLayerName(layerName, true);
      if (layerNodes === null) {
        return;
      }
      let containerHtmlId = null;
      if (layerNodes.length >= this._maxNodeChildrenSize) {
        const nodeIndex = layerNodes.indexOf(nodeId);
        const containerIndex = Math.floor(nodeIndex / this._maxNodeChildrenSize);
        const containerIdArray = _LayersTree._layerContainersMap.get(layerHtmlId);
        if (containerIdArray !== void 0 && containerIndex < containerIdArray.length) {
          containerHtmlId = containerIdArray[containerIndex];
        }
      }
      this._tree.expandChildren(layerHtmlId);
      if (containerHtmlId !== null) {
        this._tree.expandChildren(containerHtmlId);
      }
    }
  }
};
let LayersTree = _LayersTree;
// prefix for top level layer names
__publicField(LayersTree, "layerPrefix", "layer");
// prefix for parts that are in a layer
__publicField(LayersTree, "layerPartPrefix", "layerpart");
// prefix for layerpart containers
__publicField(LayersTree, "layerPartContainerPrefix", "layerpartcontainer");
__publicField(LayersTree, "_layerIdMap", /* @__PURE__ */ new Map());
__publicField(LayersTree, "_idLayerMap", /* @__PURE__ */ new Map());
__publicField(LayersTree, "_layerPartIdMap", /* @__PURE__ */ new Map());
__publicField(LayersTree, "_idLayerPartMap", /* @__PURE__ */ new Map());
__publicField(LayersTree, "_layerContainersMap", /* @__PURE__ */ new Map());
export {
  LayersTree
};
