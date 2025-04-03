var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { RelationshipType, SelectionMode } from "@hoops/web-viewer";
import { ViewTree } from "./ViewTree.js";
import { Tree } from "./types.js";
import { TreeSeparator } from "./util.js";
const _RelationshipsTree = class extends ViewTree {
  // SCA : 0? SGE:-1?
  constructor(viewer, elementId, iScroll) {
    super(viewer, elementId, iScroll);
    __publicField(this, "_currentNodeId", 0);
    // Needed to know the context // SCA : 0? SGE:-1?
    __publicField(this, "_currentBimNodeId", "0");
    this._tree.setCreateVisibilityItems(false);
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
      selectionArray: async (events) => {
        await this._onTreeSelectItem(events);
      }
    });
    this._tree.registerCallback("loadChildren", (htmlId) => {
      this._loadNodeChildren(htmlId);
    });
    this._tree.registerCallback("selectItem", async (htmlId) => {
      await this._onclickItemButton(htmlId);
    });
    this._tree.registerCallback("clickItemButton", async (htmlId) => {
      await this._onSelectRelationships(htmlId);
    });
  }
  async _onTreeSelectItem(events) {
    for (const event of events) {
      const nodeId = event.getSelection().getNodeId();
      if (nodeId === null) {
        this._tree.selectItem(null, false);
      } else {
        const bimId = this._viewer.model.getBimIdFromNode(nodeId);
        if (bimId !== null) {
          this._currentNodeId = nodeId;
          this._currentBimNodeId = bimId;
          this._update();
        }
      }
    }
  }
  _translateTypeRelationshipToString(type) {
    let typeString = "Type Unknown";
    if (type !== RelationshipType.Undefined)
      typeString = RelationshipType[type];
    return typeString;
  }
  _translateStringTypeToRelationshipType(typeString) {
    let type = RelationshipType.Undefined;
    switch (typeString) {
      case "ContainedInSpatialStructure":
        type = RelationshipType.ContainedInSpatialStructure;
        break;
      case "FillsElement":
        type = RelationshipType.FillsElement;
        break;
      case "Aggregates":
        type = RelationshipType.Aggregates;
        break;
      case "VoidsElement":
        type = RelationshipType.VoidsElement;
        break;
      case "SpaceBoundary":
        type = RelationshipType.SpaceBoundary;
        break;
      case "ConnectsPathElements":
        type = RelationshipType.ConnectsPathElements;
        break;
      default:
        type = RelationshipType.Undefined;
    }
    return type;
  }
  // const idParts = this._splitHtmlId(htmlId);
  //  switch (idParts[0]) {
  //      case "Relationpart":
  //          this._selectRelationPart(htmlId, selectionMode);
  //          break;
  //      case "relation":
  //          this._selectRelation(htmlId, selectionMode);
  //          break;
  //}
  // const idParts = this._splitHtmlId(htmlId);
  // switch (idParts[0]) {
  //     case "part":
  //         this.createMock(parseInt(idParts[1], 10));
  //         break;
  // }
  //}
  static _createIdNode(nodeid) {
    return `${_RelationshipsTree.RelationshipPartPrefix}${TreeSeparator}${nodeid}${TreeSeparator}${++this._idCount}`;
  }
  static _createIdType() {
    return `${_RelationshipsTree.RelationshipTypePrefix}${TreeSeparator}${++this._idCount}`;
  }
  /**
   * Takes a relation [[HtmlId]] and returns the name of the corresponding relation.
   * @param relationId
   */
  static getRelationshipTypeName(relationshipTypeId) {
    return this._idNameMap.get(relationshipTypeId) || null;
  }
  /**
   * Takes a relationName and returns a corresponding relation [[HtmlId]].
   * @param relationName
   */
  static getRelationshipTypeId(relationshipTypeName) {
    return this._nameIdMap.get(relationshipTypeName) || null;
  }
  _onNewModel() {
    const model = this._viewer.model;
    this._tree.clear();
    this._currentNodeId = model.getAbsoluteRootNode();
    this._currentBimNodeId = this._currentNodeId.toString();
  }
  _update() {
    this._tree.clear();
    const relationshipTypes = this._viewer.model.getRelationshipTypesFromBimId(
      this._currentNodeId,
      this._currentBimNodeId
    );
    for (const iterType of relationshipTypes) {
      const relationshipHtmlId = _RelationshipsTree._createIdType();
      const typeString = this._translateTypeRelationshipToString(iterType);
      _RelationshipsTree._idNameMap.set(relationshipHtmlId, typeString);
      _RelationshipsTree._nameIdMap.set(typeString, relationshipHtmlId);
      this._tree.appendTopLevelElement(typeString, relationshipHtmlId, "assembly", true, false);
    }
  }
  _loadNodeChildren(htmlId) {
    const typeName = _RelationshipsTree.getRelationshipTypeName(htmlId);
    if (typeName === null) {
      return;
    }
    const typeHtmlId = _RelationshipsTree.getRelationshipTypeId(typeName);
    if (typeHtmlId === null) {
      return;
    }
    this._addRelationships(typeHtmlId, typeName);
  }
  _addRelationships(parentHtmlId, typeName) {
    const type = this._translateStringTypeToRelationshipType(typeName);
    const relationships = this._viewer.model.getBimIdConnectedElements(
      this._currentNodeId,
      this._currentBimNodeId,
      type
    );
    for (const iterRelating of relationships.relatings) {
      const iterBimId = iterRelating;
      const relationHtmlId = _RelationshipsTree._createIdNode(iterRelating);
      const bimInfo = this._viewer.model.getBimInfoFromBimId(this._currentNodeId, iterBimId);
      _RelationshipsTree._idNameMap.set(relationHtmlId, bimInfo.name);
      _RelationshipsTree._idNameMap.set(bimInfo.name, relationHtmlId);
      this._tree.addChild(
        bimInfo.name,
        relationHtmlId,
        parentHtmlId,
        "assembly",
        false,
        Tree.Relationships,
        bimInfo.connected
      );
    }
    for (const iterRelated of relationships.relateds) {
      const iterBimId = iterRelated;
      const relationHtmlId = _RelationshipsTree._createIdNode(iterRelated);
      const bimInfo = this._viewer.model.getBimInfoFromBimId(this._currentNodeId, iterBimId);
      _RelationshipsTree._idNameMap.set(relationHtmlId, bimInfo.name);
      _RelationshipsTree._idNameMap.set(bimInfo.name, relationHtmlId);
      this._tree.addChild(
        bimInfo.name,
        relationHtmlId,
        parentHtmlId,
        "assembly",
        false,
        Tree.Relationships,
        bimInfo.connected
      );
    }
  }
  async _onclickItemButton(htmlId) {
    const thisElement = document.getElementById(htmlId);
    if (thisElement === null) {
      return;
    }
    const idParts = this._splitHtmlId(htmlId);
    if (idParts.length > 0) {
      const htmlId2 = this._splitHtmlIdParts(idParts[0], TreeSeparator);
      if (htmlId2[0] === _RelationshipsTree.RelationshipPartPrefix) {
        const nodeId = this._viewer.model.getNodeIdFromBimId(this._currentNodeId, htmlId2[1]);
        if (nodeId !== null) {
          this._viewer.model.resetModelHighlight();
          this._viewer.model.setNodesHighlighted([nodeId], true);
        }
      }
    }
  }
  async _onSelectRelationships(htmlId) {
    const idParts = this._splitHtmlId(htmlId);
    if (idParts.length > 0) {
      const htmlId2 = this._splitHtmlIdParts(idParts[0], TreeSeparator);
      if (htmlId2[0] === _RelationshipsTree.RelationshipPartPrefix) {
        const nodeId = this._viewer.model.getNodeIdFromBimId(this._currentNodeId, htmlId2[1]);
        this._viewer.selectPart(nodeId, SelectionMode.Set);
      }
    }
  }
};
let RelationshipsTree = _RelationshipsTree;
__publicField(RelationshipsTree, "RelationshipPrefix", "relships");
__publicField(RelationshipsTree, "RelationshipTypePrefix", "relshipsType");
__publicField(RelationshipsTree, "RelationshipPartPrefix", "relshipsPart");
__publicField(RelationshipsTree, "_idCount", 0);
__publicField(RelationshipsTree, "_nameIdMap", /* @__PURE__ */ new Map());
__publicField(RelationshipsTree, "_idNameMap", /* @__PURE__ */ new Map());
export {
  RelationshipsTree
};
