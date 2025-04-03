var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { SelectionMode, Util, createUuid } from "@hoops/web-viewer";
import { ViewTree } from "./ViewTree.js";
import { Tree, ContainerMapElement } from "./types.js";
import { getContainerId, getComponentPartId, getGenericTypeId } from "./util.js";
function isIfcType(s) {
  return s.substr(0, 3) === "IFC";
}
class TypesTree extends ViewTree {
  constructor(viewer, elementId, iScroll) {
    super(viewer, elementId, iScroll);
    // Assigned on modelStructureReady
    __publicField(this, "_ifcNodesMap");
    // Maps container UUIDs their contained elements for types that require containers
    __publicField(this, "_containerMap");
    this._containerMap = /* @__PURE__ */ new Map();
    this._initEvents();
  }
  _initEvents() {
    const onNewModel = () => {
      return this._onNewModel();
    };
    this._viewer.setCallbacks({
      modelStructureReady: onNewModel,
      selectionArray: (events) => {
        if (this._ifcNodesMap !== void 0 && this._ifcNodesMap.size > 0) {
          this._tree.updateSelection(events);
        }
      },
      visibilityChanged: () => {
        this._tree.updateTypesVisibilityIcons();
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
    const partId = idParts[1];
    if (isIfcType(partId)) {
      this._selectIfcComponent(partId, selectionMode);
    } else {
      this._viewer.selectPart(parseInt(partId, 10), selectionMode);
    }
  }
  _loadNodeChildren(parentHtmlId) {
    const idParts = this._splitHtmlId(parentHtmlId);
    const nodeKind = idParts[0];
    switch (nodeKind) {
      case "typespart":
        return;
      case "types":
        this._loadGenericTypeChildren(parentHtmlId);
        break;
      case "container":
        this._loadContainerChildren(parentHtmlId);
        break;
    }
  }
  _loadGenericTypeChildren(parentHtmlId) {
    const idParts = this._splitHtmlId(parentHtmlId);
    const genericType = idParts[1];
    const nodeIds = this._ifcNodesMap.get(genericType);
    if (nodeIds === void 0) {
      return;
    }
    if (nodeIds.size > this._maxNodeChildrenSize) {
      this._createContainerNodes(parentHtmlId, genericType);
      return;
    }
    nodeIds.forEach((nodeId) => {
      this._addChildPart(nodeId, parentHtmlId);
    });
  }
  _loadContainerChildren(parentHtmlId) {
    const containerUuid = this._splitHtmlId(parentHtmlId)[1];
    const containerMapElement = this._containerMap.get(containerUuid);
    if (containerMapElement === void 0) {
      return;
    }
    const genericType = containerMapElement.genericType;
    const containerIndex = containerMapElement.index;
    const allNodeIds = this._ifcNodesMap.get(genericType);
    if (allNodeIds === void 0) {
      return;
    }
    const nodeIdStartIndex = containerIndex * this._maxNodeChildrenSize;
    const partiallyFilled = allNodeIds.size - nodeIdStartIndex < this._maxNodeChildrenSize;
    const nodeIdEndIndex = partiallyFilled ? allNodeIds.size : nodeIdStartIndex + this._maxNodeChildrenSize;
    const containerNodeIds = Util.setToArray(allNodeIds).slice(nodeIdStartIndex, nodeIdEndIndex);
    for (const nodeId of containerNodeIds) {
      this._addChildPart(nodeId, parentHtmlId);
    }
  }
  _addChildPart(nodeId, parentHtmlId) {
    const childHtmlId = getComponentPartId(nodeId);
    const name = this._viewer.model.getNodeName(nodeId);
    this._tree.addChild(name, childHtmlId, parentHtmlId, "part", false, Tree.Types);
  }
  _createContainerNodes(parentHtmlId, genericType) {
    const nodeIds = this._ifcNodesMap.get(genericType);
    if (nodeIds === void 0) {
      console.assert(false, "Tried to create a container for nodes of a non-existent GenericType");
      return;
    }
    for (let startNode = 0; startNode < nodeIds.size; startNode += this._maxNodeChildrenSize) {
      const partiallyFilled = startNode + this._maxNodeChildrenSize > nodeIds.size;
      const endNode = partiallyFilled ? nodeIds.size - 1 : startNode + this._maxNodeChildrenSize - 1;
      const containerName = `Child nodes ${startNode} - ${endNode}`;
      const containerIndex = startNode / this._maxNodeChildrenSize;
      const containerUuid = createUuid();
      this._tree.addChild(
        containerName,
        getContainerId(containerUuid),
        parentHtmlId,
        "container",
        true,
        Tree.Types
      );
      const containerMapElement = new ContainerMapElement(genericType, containerIndex);
      this._containerMap.set(containerUuid, containerMapElement);
    }
  }
  _selectIfcComponent(genericType, selectionMode) {
    this._viewer.selectionManager.selectType(genericType, selectionMode);
  }
  async _onNewModel() {
    const model = this._viewer.model;
    this._tree.clear();
    this._ifcNodesMap = model.getGenericTypeIdMap();
    this._ifcNodesMap.forEach((_, genericType) => {
      const parentHtmlId = getGenericTypeId(genericType);
      const itemType = "assembly";
      const hasChildren = true;
      const loadChildren = false;
      this._tree.appendTopLevelElement(
        genericType,
        parentHtmlId,
        itemType,
        hasChildren,
        loadChildren
      );
    });
    if (this._ifcNodesMap.size === 0) {
      this.hideTab();
    } else {
      this.showTab();
    }
  }
}
export {
  TypesTree
};
