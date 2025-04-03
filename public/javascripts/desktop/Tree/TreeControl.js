var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key2, value) => key2 in obj ? __defProp(obj, key2, { enumerable: true, configurable: true, writable: true, value }) : obj[key2] = value;
var __publicField = (obj, key2, value) => {
  __defNormalProp(obj, typeof key2 !== "symbol" ? key2 + "" : key2, value);
  return value;
};
import { Util, NodeType, Event, InvalidNodeId, SelectionMode, Point2, CommunicatorError } from "@hoops/web-viewer";
import { TaggedId, Tree } from "./types.js";
import { VisibilityControl } from "./VisibilityControl.js";
import { DefaultUiTransitionDuration } from "../../common/UiUtil.js";
import { _filterActiveSheetNodeIds } from "../../common/IsolateZoomHelper.js";
import { TreeVisibilityPrefix, TreeSeparator, TreeGetLayerPartId, getComponentPartId, TreeLayerPartContainerPrefix, TreeGetLayerName, TreeGetPartId, TreeGetLayerId, getGenericTypeId } from "./util.js";
const _TreeControl = class {
  constructor(elementId, viewer, separator, treeScroll) {
    __publicField(this, "_elementId");
    __publicField(this, "_listRoot");
    __publicField(this, "_partVisibilityRoot");
    __publicField(this, "_separator");
    // For [[HtmlId]]s
    // keeps track of the last non selection item (measurement, view, etc)
    __publicField(this, "_$lastNonSelectionItem");
    // keeps track of the last clicked list item id
    __publicField(this, "_lastItemId", null);
    // keeps track of the selection items
    __publicField(this, "_selectedPartItems", []);
    // keep track of nodes that are in the selection set but not in the model tree
    __publicField(this, "_futureHighlightIds", /* @__PURE__ */ new Set());
    // keep track of nodes that have children that are selected, but are not in the model tree
    __publicField(this, "_futureMixedIds", /* @__PURE__ */ new Set());
    // keep track of selected items parents
    __publicField(this, "_selectedItemsParentIds", []);
    // keeps track of layer selection items
    __publicField(this, "_selectedLayers", []);
    // keep track of layers with a selected item
    __publicField(this, "_mixedItemsLayer", /* @__PURE__ */ new Set());
    // keeps track of component types selection items
    __publicField(this, "_selectedTypes", []);
    // keeps track of component type ids that may have children selected
    __publicField(this, "_futureMixedTypesIds", []);
    // keeps track of component types that have children selected
    __publicField(this, "_mixedTypes", /* @__PURE__ */ new Set());
    // keeps track of the model visibility state
    __publicField(this, "_visibilityControl");
    __publicField(this, "_callbacks", /* @__PURE__ */ new Map());
    __publicField(this, "_childrenLoaded", /* @__PURE__ */ new Set());
    __publicField(this, "_loadedNodes", /* @__PURE__ */ new Set());
    __publicField(this, "_touchTimer", new Util.Timer());
    // prevent the model browser nodes from expanding
    __publicField(this, "_freezeExpansion", false);
    // Set timer for scrolling and clear it each time a new item in the tree should be visible.
    // This will avoid scrolling down the tree when several nodes are selected at once.
    __publicField(this, "_scrollTimer", new Util.Timer());
    // prevent selection highlighting from triggering if multiple items are being selected in succesion
    __publicField(this, "_selectionLabelHighlightTimer", new Util.Timer());
    __publicField(this, "_viewer");
    __publicField(this, "_treeScroll");
    // when true, visibility items will be created along with each item added to the tree
    __publicField(this, "_createVisibilityItems", true);
    this._elementId = elementId;
    this._viewer = viewer;
    this._treeScroll = treeScroll;
    this._separator = separator;
    this._visibilityControl = new VisibilityControl(viewer);
    this._partVisibilityRoot = document.createElement("ul");
    this._listRoot = document.createElement("ul");
    this._init();
  }
  setCreateVisibilityItems(createVisibilityItems) {
    this._createVisibilityItems = createVisibilityItems;
  }
  getElementId() {
    return this._elementId;
  }
  getRoot() {
    return this._listRoot;
  }
  getPartVisibilityRoot() {
    return this._partVisibilityRoot;
  }
  getVisibilityControl() {
    return this._visibilityControl;
  }
  registerCallback(name, func) {
    if (!this._callbacks.has(name))
      this._callbacks.set(name, []);
    this._callbacks.get(name).push(func);
  }
  _triggerCallback(name, ...args) {
    const callbacks = this._callbacks.get(name);
    if (callbacks) {
      for (const callback of callbacks) {
        callback.apply(null, args);
      }
    }
  }
  deleteNode(htmlId) {
    const id = htmlId.charAt(0) === "#" ? htmlId.slice(1) : htmlId;
    jQuery(`#${id}`).remove();
    jQuery(`#visibility${this._separator}${id}`).remove();
  }
  addChild(name, htmlId, parent, itemType, hasChildren, treeType, accessible = true, ignoreLoaded = false, tag) {
    const taggedId = tag ? new TaggedId(tag) : this._parseTaggedId(htmlId);
    if (taggedId === null) {
      return null;
    }
    if (treeType === Tree.Model && itemType !== "container" && taggedId.nodeId !== null) {
      if (this._loadedNodes.has(taggedId.nodeId) && !ignoreLoaded) {
        return null;
      }
      this._loadedNodes.add(taggedId.nodeId);
    }
    if (name === null) {
      name = "unnamed";
    }
    this._addVisibilityToggleChild(htmlId, parent, itemType);
    const $parent = jQuery(`#${parent}`);
    $parent.children(".ui-modeltree-container").children(".ui-modeltree-expandNode").css("visibility", "visible");
    const $childList = $parent.children("ul");
    let selected = false;
    let mixed = false;
    if (taggedId.nodeId !== null) {
      selected = this._futureHighlightIds.has(taggedId.nodeId);
      mixed = this._futureMixedIds.has(taggedId.nodeId);
      if (selected) {
        this._futureHighlightIds.delete(taggedId.nodeId);
      }
      if (mixed) {
        this._futureMixedIds.delete(taggedId.nodeId);
      }
    }
    const node = this._buildNode(
      name,
      htmlId,
      itemType,
      hasChildren,
      selected,
      mixed,
      accessible,
      treeType === Tree.Relationships
    );
    if ($childList.length === 0) {
      const target = document.createElement("ul");
      target.classList.add("ui-modeltree-children");
      $parent.append(target);
      target.appendChild(node);
    } else {
      $childList.get(0).appendChild(node);
    }
    if (selected) {
      const $listItem = this._getListItem(htmlId);
      if ($listItem !== null) {
        this._selectedPartItems.push($listItem);
      }
    }
    this._triggerCallback("addChild");
    return node;
  }
  _addVisibilityToggleChild(htmlId, parent, itemType) {
    const $parent = jQuery(`#visibility${this._separator}${parent}`);
    $parent.children(".ui-modeltree-visibility-container").css("visibility", "visible");
    const $childList = $parent.children("ul");
    let target;
    if ($childList.length === 0) {
      target = document.createElement("ul");
      target.classList.add("ui-modeltree-visibility-children");
      $parent.append(target);
    } else {
      target = $childList.get(0);
    }
    const node = this._buildPartVisibilityNode(htmlId, itemType);
    if (node !== null) {
      target.appendChild(node);
    }
  }
  _buildPartVisibilityNode(htmlId, itemType) {
    if (!this._createVisibilityItems) {
      return null;
    }
    const itemNode = document.createElement("div");
    itemNode.classList.add("ui-modeltree-partVisibility-icon");
    const childItem = document.createElement("li");
    childItem.classList.add("ui-modeltree-item");
    childItem.classList.add("visibility");
    childItem.id = `${TreeVisibilityPrefix}${TreeSeparator}${htmlId}`;
    childItem.appendChild(itemNode);
    if (itemType !== "measurement") {
      let nodeId;
      const nodeIdStr = htmlId.split(this._separator).pop();
      if (nodeIdStr !== void 0) {
        nodeId = parseInt(nodeIdStr, 10);
      }
      if (nodeId === void 0 || isNaN(nodeId)) {
        return childItem;
      }
      const nodeType = this._viewer.model.getNodeType(nodeId);
      if (nodeType === NodeType.Pmi || nodeType === NodeType.PmiBody) {
        childItem.style.visibility = "hidden";
      }
    }
    return childItem;
  }
  freezeExpansion(freeze) {
    this._freezeExpansion = freeze;
  }
  updateSelection(items) {
    if (items === null) {
      items = this._viewer.selectionManager.getResults();
    }
    const nodeIds = items.map((item) => {
      if (item instanceof Event.NodeSelectionEvent) {
        const x = item.getSelection();
        if (x.isNodeSelection()) {
          item = x;
        } else {
          console.assert(false);
          return InvalidNodeId;
        }
      }
      return item.getNodeId();
    });
    this._updateTreeSelectionHighlight(nodeIds);
    this._doUnfreezeSelection(nodeIds);
  }
  collapseAllChildren(elementId) {
    if (!this._freezeExpansion) {
      $(`#${elementId} .ui-modeltree-children`).hide();
      $(`#${elementId} .ui-modeltree-visibility-children`).hide();
      $(`#${elementId} .expanded`).removeClass("expanded");
    }
  }
  _expandChildren(htmlId, ignoreFreeze) {
    const $item = $(`#${htmlId}`);
    this.preloadChildrenIfNecessary(htmlId);
    if (!this._freezeExpansion || ignoreFreeze) {
      if ($item.length > 0) {
        $item.children(".ui-modeltree-children").show();
        $item.children(".ui-modeltree-container").children(".ui-modeltree-expandNode").addClass("expanded");
      }
      this._expandVisibilityChildren(htmlId);
    }
  }
  expandChildren(htmlId) {
    this._expandChildren(htmlId, false);
  }
  _expandVisibilityChildren(htmlId) {
    const $item = $(`#visibility${this._separator + htmlId}`);
    if ($item.length > 0) {
      const $visibilityChildren = $item.children(".ui-modeltree-visibility-children");
      $visibilityChildren.addClass("visible");
      $visibilityChildren.show();
    }
  }
  collapseChildren(htmlId) {
    this._collapseVisibilityChildren(htmlId);
    const $item = $(`#${htmlId}`);
    if ($item.length > 0)
      $item.children(".ui-modeltree-children").hide();
  }
  _collapseVisibilityChildren(htmlId) {
    const $item = $(`#visibility${this._separator}${htmlId}`);
    if ($item.length > 0)
      $item.children(".ui-modeltree-visibility-children").hide();
  }
  _buildNode(name, htmlId, itemType, hasChildren, selected = false, mixed = false, accessible = true, isFromRelationships = false) {
    const childItem = document.createElement("li");
    childItem.classList.add("ui-modeltree-item");
    if (selected) {
      childItem.classList.add("selected");
    }
    if (mixed) {
      childItem.classList.add("mixed");
    }
    childItem.id = htmlId;
    const itemNode = document.createElement("div");
    itemNode.classList.add("ui-modeltree-container");
    itemNode.style.whiteSpace = "nowrap";
    const expandNode = document.createElement("div");
    expandNode.classList.add("ui-modeltree-expandNode");
    if (!hasChildren)
      expandNode.style.visibility = "hidden";
    itemNode.appendChild(expandNode);
    const iconNode = document.createElement("div");
    iconNode.classList.add("ui-modeltree-icon");
    iconNode.classList.add(itemType);
    itemNode.appendChild(iconNode);
    const labelNode = document.createElement("div");
    if (isFromRelationships === false) {
      if (accessible) {
        labelNode.classList.add("ui-modeltree-label");
      }
    } else {
      if (accessible) {
        labelNode.classList.add("ui-modeltree-relationships-label");
      } else {
        labelNode.classList.add("ui-modeltree-relationships-label_unaccess");
      }
    }
    labelNode.innerHTML = $("<div>").text(name).html();
    labelNode.title = name;
    itemNode.appendChild(labelNode);
    const mixedSelection = document.createElement("div");
    mixedSelection.classList.add("ui-mixedselection-icon");
    itemNode.appendChild(mixedSelection);
    childItem.appendChild(itemNode);
    return childItem;
  }
  childrenAreLoaded(htmlId) {
    return this._childrenLoaded.has(htmlId);
  }
  preloadChildrenIfNecessary(htmlId) {
    if (htmlId !== null && !this._childrenLoaded.has(htmlId)) {
      this._triggerCallback("loadChildren", htmlId);
      this._childrenLoaded.add(htmlId);
    }
  }
  _processExpandClick(event) {
    const $target = jQuery(event.target);
    const $listItem = $target.parents(".ui-modeltree-item");
    const htmlId = $listItem.get(0).id;
    if ($target.hasClass("expanded")) {
      this._collapseListItem(htmlId);
    } else {
      this._expandListItem(htmlId);
    }
  }
  /** @hidden */
  _collapseListItem(htmlId) {
    this.collapseChildren(htmlId);
    const $target = $(`#${htmlId}`).find(".ui-modeltree-expandNode").first();
    $target.removeClass("expanded");
    this._triggerCallback("collapse", htmlId);
  }
  /** @hidden */
  _expandListItem(htmlId) {
    this.expandChildren(htmlId);
    const $target = $(`#${htmlId}`).find(".ui-modeltree-expandNode").first();
    $target.addClass("expanded");
    this._triggerCallback("expand", htmlId);
  }
  selectItem(htmlId, triggerEvent = true) {
    this._doSelection(htmlId, triggerEvent);
  }
  highlightItem(htmlId, triggerEvent = true) {
    this._doHighlight(htmlId, triggerEvent);
  }
  _getListItem(htmlId) {
    const $listItem = $(this._listRoot).find(`#${htmlId}`);
    if ($listItem.length > 0) {
      return $listItem;
    }
    return null;
  }
  _updateNonSelectionHighlight($listItem) {
    if (this._$lastNonSelectionItem !== void 0) {
      this._$lastNonSelectionItem.removeClass("selected");
    }
    $listItem.addClass("selected");
    this._$lastNonSelectionItem = $listItem;
  }
  _doUnfreezeSelection(selectionIds) {
    for (const id of selectionIds) {
      const parentId = this._viewer.model.getNodeParent(id);
      const $listItem = this._getListItem(`part${TreeSeparator}${id}`);
      if ($listItem !== null && !$listItem.hasClass("selected")) {
        $listItem.addClass("selected");
        this._selectedPartItems.push($listItem);
      } else if ($listItem === null) {
        this._futureHighlightIds.add(id);
      }
      if (parentId !== null) {
        const layerPartId = TreeGetLayerPartId(parentId);
        if (layerPartId !== null) {
          const $parentListItem = this._getListItem(layerPartId);
          if ($parentListItem !== null && !$parentListItem.hasClass("selected")) {
            $parentListItem.addClass("selected");
            this._selectedPartItems.push($parentListItem);
          } else if ($parentListItem === null) {
            this._futureHighlightIds.add(parentId);
          }
        }
        const $typesListParentItem = this._getListItem(getComponentPartId(parentId));
        if ($typesListParentItem !== null) {
          if (!$typesListParentItem.hasClass("selected")) {
            $typesListParentItem.addClass("selected");
            this._selectedPartItems.push($typesListParentItem);
          }
        }
      }
      const $typesListItem = this._getListItem(getComponentPartId(id));
      if ($typesListItem !== null) {
        if (!$typesListItem.hasClass("selected")) {
          $typesListItem.addClass("selected");
          this._selectedPartItems.push($typesListItem);
        }
      }
    }
  }
  /** @hidden */
  _doSelection(htmlId, triggerEvent = true) {
    if (htmlId !== null) {
      const idParts = htmlId.split(this._separator);
      const isPart = idParts[0] === "part";
      const isLayerPart = idParts[0] === "layerpart";
      const isTypePart = idParts[0] === "typespart";
      const $listItem = $(`#${htmlId}`);
      let contains = false;
      if (isPart || isLayerPart || isTypePart) {
        $listItem.addClass("selected");
        for (const $item of this._selectedPartItems) {
          const item = $item.get(0);
          if (item !== void 0) {
            if (htmlId === item.id) {
              contains = true;
              break;
            }
          }
        }
        if (!contains) {
          this._selectedPartItems.push($listItem);
        }
      } else if (htmlId.lastIndexOf("sheet", 0) === 0)
        ;
      else {
        if (htmlId.lastIndexOf("container", 0) === 0) {
          return;
        } else if (idParts[0] === TreeLayerPartContainerPrefix) {
          return;
        } else {
          this._updateNonSelectionHighlight($listItem);
        }
      }
      if (triggerEvent) {
        this._lastItemId = htmlId;
        const toggleKeyActive = typeof key !== "undefined" && (key.ctrl || key.command);
        const repeatSelection = contains && this._selectedPartItems.length === 1;
        const mode = toggleKeyActive || repeatSelection ? SelectionMode.Toggle : SelectionMode.Set;
        this._triggerCallback("selectItem", htmlId, mode);
      }
      if (this._lastItemId !== htmlId && !this._freezeExpansion && !triggerEvent) {
        this._scrollToItem($listItem);
      }
    }
    this._lastItemId = htmlId;
    this._selectionLabelHighlightTimer.set(30, () => {
      const selectionIds = this._viewer.selectionManager.getResults().map((item) => item.getNodeId());
      this._updateTreeSelectionHighlight(selectionIds);
    });
  }
  _doHighlight(htmlId, triggerEvent = true) {
    const $listItem = $(`#${htmlId}`);
    this._updateNonSelectionHighlight($listItem);
    if (triggerEvent && htmlId !== null)
      this._triggerCallback("selectItem", htmlId, SelectionMode.Set);
  }
  _doSelectIfcItem(htmlId, triggerEvent = true) {
    const $listItem = $(`#${htmlId}`);
    this._updateNonSelectionHighlight($listItem);
    if (triggerEvent && htmlId !== null)
      this._triggerCallback("clickItemButton", htmlId);
  }
  _scrollToItem($listItem) {
    this._scrollTimer.set(_TreeControl._ScrollToItemDelayMs, () => {
      const offset = $listItem.offset();
      const containerHeight = $("#modelTreeContainer").innerHeight();
      if (offset !== void 0 && containerHeight !== void 0) {
        const offsetTop = offset.top;
        const hiddenTop = offsetTop < 6;
        const hiddenBottom = offsetTop > containerHeight;
        if (hiddenTop || hiddenBottom) {
          this._scrollTimer.clear();
          if (this._treeScroll) {
            this._treeScroll.refresh();
            this._treeScroll.scrollToElement(
              $listItem.get(0),
              DefaultUiTransitionDuration,
              true,
              true
            );
          }
        }
      }
    });
  }
  _parseTaggedId(htmlId) {
    const uuid = this._parseUuid(htmlId);
    if (uuid !== null) {
      return new TaggedId(uuid);
    }
    const nodeId = this._parseNodeId(htmlId);
    if (nodeId !== null) {
      return new TaggedId(nodeId);
    }
    return null;
  }
  // Note that measurements and markup views have guid identifers.
  // In the case that we are asked to parse an html id for such an element we cannot deduce a node identifier for the item.
  // In that case the _parseGuid function should be used to deduce the id.
  _parseNodeId(htmlId) {
    const idComponents = htmlId.split(this._separator);
    if (idComponents.length < 2 || idComponents[0] === "measurement" || idComponents[0] === "markupview") {
      return null;
    }
    const idPart = idComponents[idComponents.length - 1];
    if (idPart !== void 0) {
      const nodeId = parseInt(idPart, 10);
      if (!isNaN(nodeId)) {
        return nodeId;
      }
    }
    return null;
  }
  _parseUuid(htmlId) {
    const hyphenatedUuidLen = 36;
    const idPart = htmlId.split(this._separator).pop();
    if (idPart !== void 0 && idPart.length === hyphenatedUuidLen) {
      return idPart;
    }
    return null;
  }
  _parseMeasurementId(htmlId) {
    return htmlId.split(this._separator).pop();
  }
  _parseVisibilityLayerName(htmlId) {
    const idParts = htmlId.split(`${TreeVisibilityPrefix}${TreeSeparator}`);
    if (idParts.length !== 2) {
      return null;
    }
    return TreeGetLayerName(idParts[1]);
  }
  _parseVisibilityLayerNodeId(htmlId) {
    const idParts = htmlId.split(`${TreeVisibilityPrefix}${TreeSeparator}`);
    if (idParts.length !== 2) {
      return null;
    }
    return TreeGetPartId(idParts[1]);
  }
  _updateLayerTreeSelectionHighlight(nodeIds) {
    for (const layerName of this._selectedLayers) {
      $(`#${TreeGetLayerId(layerName)}`).removeClass("selected");
    }
    this._mixedItemsLayer.forEach((layerId) => {
      const layerName = this._viewer.model.getLayerName(layerId);
      if (layerName !== null) {
        $(`#${TreeGetLayerId(layerName)}`).addClass("mixed");
      }
    });
    this._selectedLayers = this._viewer.selectionManager.getSelectedLayers();
    for (const layerName of this._selectedLayers) {
      $(`#${TreeGetLayerId(layerName)}`).addClass("selected");
      $(`#${TreeGetLayerId(layerName)}`).removeClass("mixed");
    }
    for (const nodeId of nodeIds) {
      $(`#${TreeGetLayerPartId(nodeId)}`).addClass("selected");
    }
  }
  _addMixedTypeClass(nodeId) {
    const type = this._viewer.model.getNodeGenericType(nodeId);
    if (type !== null && !this._mixedTypes.has(type)) {
      $(`#${getGenericTypeId(type)}`).addClass("mixed");
      this._mixedTypes.add(type);
      return true;
    }
    return false;
  }
  _updateTypesTreeSelectionHighlight() {
    for (const type of this._selectedTypes) {
      $(`#${getGenericTypeId(type)}`).removeClass("selected");
    }
    for (const nodeId of this._futureMixedTypesIds) {
      if (!this._addMixedTypeClass(nodeId)) {
        const parentId = this._viewer.model.getNodeParent(nodeId);
        if (parentId !== null) {
          this._addMixedTypeClass(parentId);
        }
      }
    }
    this._selectedTypes = this._viewer.selectionManager.getSelectedTypes();
    for (const type of this._selectedTypes) {
      const $type = $(`#${getGenericTypeId(type)}`);
      $type.addClass("selected");
      $type.removeClass("mixed");
    }
  }
  // update the tree highlighting for selection items (not cadviews, measurements, etc)
  _updateTreeSelectionHighlight(selectionIds) {
    this._futureHighlightIds.forEach((key2) => {
      if (selectionIds.indexOf(key2) >= 0) {
        this._futureHighlightIds.delete(key2);
      }
    });
    for (const nodeId of this._selectedItemsParentIds) {
      $(`#part${TreeSeparator}${nodeId}`).removeClass("mixed");
    }
    this._selectedItemsParentIds.length = 0;
    this._futureMixedIds.clear();
    this._mixedItemsLayer.forEach((layerId) => {
      const layerName = this._viewer.model.getLayerName(layerId);
      if (layerName !== null) {
        $(`#${TreeGetLayerId(layerName)}`).removeClass("mixed");
      }
    });
    this._mixedItemsLayer.clear();
    this._mixedTypes.forEach((type) => {
      $(`#${getGenericTypeId(type)}`).removeClass("mixed");
    });
    this._mixedTypes.clear();
    this._futureMixedTypesIds = [];
    Util.filterInPlace(this._selectedPartItems, ($item) => {
      const element = $item.get(0);
      if (element !== void 0) {
        const nodeId = this._parseNodeId(element.id);
        if (nodeId === null) {
          return false;
        } else if (selectionIds.indexOf(nodeId) < 0) {
          $(`#part${TreeSeparator}${nodeId}`).removeClass("selected");
          $(`#typespart${TreeSeparator}${nodeId}`).removeClass("selected");
          const layerPartNodeId = TreeGetLayerPartId(nodeId);
          if (layerPartNodeId)
            $(`#${layerPartNodeId}`).removeClass("selected");
          return false;
        }
      }
      return true;
    });
    for (const nodeId of selectionIds) {
      this._updateParentIdList(nodeId);
      this._updateMixedLayers(nodeId);
      this._updateMixedTypes(nodeId);
    }
    for (const nodeId of this._selectedItemsParentIds) {
      const $listItem = this._getListItem(`part${TreeSeparator}${nodeId}`);
      if ($listItem !== null && !$listItem.hasClass("mixed")) {
        $listItem.addClass("mixed");
      } else {
        this._futureMixedIds.add(nodeId);
      }
    }
    this._updateLayerTreeSelectionHighlight(selectionIds);
    this._updateTypesTreeSelectionHighlight();
  }
  // add mixed class to parents of selected items
  _updateParentIdList(childId) {
    const model = this._viewer.model;
    if (model.isNodeLoaded(childId)) {
      let parentId = model.getNodeParent(childId);
      while (parentId !== null && this._selectedItemsParentIds.indexOf(parentId) === -1) {
        this._selectedItemsParentIds.push(parentId);
        parentId = model.getNodeParent(parentId);
      }
    }
  }
  // add mixed class to layers with selected items
  _updateMixedLayers(nodeId) {
    const addNodeLayer = (nodeId2) => {
      const layerId = this._viewer.model.getNodeLayerId(nodeId2);
      if (layerId !== null) {
        this._mixedItemsLayer.add(layerId);
      }
    };
    const childNodeIds = this._viewer.model.getNodeChildren(nodeId);
    for (const childNodeId of childNodeIds) {
      addNodeLayer(childNodeId);
    }
    addNodeLayer(nodeId);
  }
  // add mixed class to types with selected items
  _updateMixedTypes(nodeId) {
    this._futureMixedTypesIds.push(nodeId);
  }
  _processLabelContext(event, position) {
    const $target = jQuery(event.target);
    const $listItem = $target.closest(".ui-modeltree-item");
    if (!position) {
      position = new Point2(event.clientX, event.clientY);
    }
    const id = $listItem.get(0).id;
    this._triggerCallback("context", id, position);
  }
  _processLabelClick(event) {
    const $target = jQuery(event.target);
    const $listItem = $target.closest(".ui-modeltree-item");
    this._doSelection($listItem.get(0).id, true);
  }
  _processLabelRSClick(event) {
    const $target = jQuery(event.target);
    const $listItem = $target.closest(".ui-modeltree-item");
    this._doHighlight($listItem.get(0).id, true);
  }
  _processLabelRSClickButton(event) {
    const $target = jQuery(event.target);
    const $listItem = $target.closest(".ui-modeltree-item");
    this._doSelectIfcItem($listItem.get(0).id, true);
  }
  appendTopLevelElement(name, htmlId, itemType, hasChildren, loadChildren = true, markChildrenLoaded = false) {
    if (name === null) {
      name = "unnamed";
    }
    const childItem = this._buildNode(name, htmlId, itemType, hasChildren);
    if (htmlId.substring(0, 4) === "part" && this._listRoot.firstChild) {
      this._listRoot.insertBefore(childItem, this._listRoot.firstChild);
    } else {
      this._listRoot.appendChild(childItem);
    }
    const childVisibilityItem = this._buildPartVisibilityNode(htmlId, itemType);
    if (childVisibilityItem !== null) {
      this._partVisibilityRoot.appendChild(childVisibilityItem);
    }
    if (loadChildren) {
      this.preloadChildrenIfNecessary(htmlId);
    }
    if (markChildrenLoaded) {
      this._childrenLoaded.add(htmlId);
    }
    return childItem;
  }
  insertNodeAfter(name, htmlId, itemType, element, hasChildren) {
    return this._insertNodeAfter(name, htmlId, itemType, element, hasChildren);
  }
  /** @hidden */
  _insertNodeAfter(name, htmlId, itemType, element, hasChildren) {
    if (name === null) {
      name = "unnamed";
    }
    if (element.parentNode === null) {
      throw new CommunicatorError("element.parentNode is null");
    }
    const childItem = this._buildNode(name, htmlId, itemType, hasChildren);
    if (element.nextSibling)
      element.parentNode.insertBefore(childItem, element.nextSibling);
    else
      element.parentNode.appendChild(childItem);
    this.preloadChildrenIfNecessary(htmlId);
    return childItem;
  }
  clear() {
    while (this._listRoot.firstChild) {
      this._listRoot.removeChild(this._listRoot.firstChild);
    }
    while (this._partVisibilityRoot.firstChild) {
      this._partVisibilityRoot.removeChild(this._partVisibilityRoot.firstChild);
    }
    this._childrenLoaded.clear();
    this._loadedNodes.clear();
  }
  // expand to first node with multiple children
  expandInitialNodes(htmlId) {
    let currentHtmlId = htmlId;
    let childNodes = [];
    while (childNodes.length <= 1) {
      childNodes = this._getChildItemsFromModelTreeItem($(`#${currentHtmlId}`));
      if (childNodes.length === 0) {
        break;
      }
      this._expandChildren(currentHtmlId, true);
      currentHtmlId = childNodes[0].id;
      this.preloadChildrenIfNecessary(currentHtmlId);
    }
  }
  /** @hidden */
  async _processVisibilityClick(htmlId) {
    const prefix = htmlId.split(this._separator)[1];
    switch (prefix) {
      case "part":
        return this._processPartVisibilityClick(htmlId);
      case "measurement":
        return this._processMeasurementVisibilityClick(htmlId);
      case "layer":
        return this._processLayerVisibilityClick(htmlId);
      case "layerpart":
        return this._processLayerPartVisibilityClick(htmlId);
      case "types":
        return this._processTypesVisibilityClick(htmlId);
      case "typespart":
        return this._processTypesPartVisibilityClick(htmlId);
    }
  }
  async _processPartVisibilityClick(htmlId) {
    const nodeId = this._parseNodeId(htmlId);
    if (nodeId !== null) {
      await this._processPartVisibility(nodeId);
    }
  }
  async _processPartVisibility(nodeId) {
    const model = this._viewer.model;
    const visibility = model.getNodeVisibility(nodeId);
    const isIfcSpace = model.hasEffectiveGenericType(nodeId, "IFCSPACE");
    await model.setNodesVisibility([nodeId], !visibility, isIfcSpace ? false : null);
  }
  //update the visibility state of measurement items in the scene
  _processMeasurementVisibilityClick(htmlId) {
    const parsedGuid = this._parseMeasurementId(htmlId);
    const measureItems = this._viewer.measureManager.getAllMeasurements();
    if (parsedGuid === "measurementitems") {
      let visibility = true;
      for (const measureItem of measureItems) {
        if (measureItem.getVisibility()) {
          visibility = false;
          break;
        }
      }
      for (const measureItem of measureItems) {
        measureItem.setVisibility(visibility);
      }
    } else {
      for (const measureItem of measureItems) {
        if (parsedGuid === measureItem._getId()) {
          const visibility = measureItem.getVisibility();
          measureItem.setVisibility(!visibility);
        }
      }
    }
  }
  async _processTypesVisibilityClick(htmlId) {
    const type = htmlId.split(this._separator).pop();
    if (type === void 0) {
      return;
    }
    await this._processTypesVisibility(type);
  }
  async _processTypesVisibility(type) {
    const model = this._viewer.model;
    let visibility = false;
    const nodeIds = model.getNodesByGenericType(type);
    if (nodeIds !== null) {
      const visibilityIds = [];
      nodeIds.forEach((nodeId) => {
        visibility = visibility || model.getNodeVisibility(nodeId);
        visibilityIds.push(nodeId);
      });
      await model.setNodesVisibility(
        visibilityIds,
        !visibility,
        type === "IFCSPACE" ? false : null
      );
      this.updateTypesVisibilityIcons();
    }
  }
  async _processTypesPartVisibilityClick(htmlId) {
    const nodeId = this._parseNodeId(htmlId);
    if (nodeId === null) {
      return;
    }
    await this._processTypesPartVisibility(nodeId);
  }
  async _processTypesPartVisibility(nodeId) {
    const model = this._viewer.model;
    const visibility = await model.getNodeVisibility(nodeId);
    const isIfcSpace = model.hasEffectiveGenericType(nodeId, "IFCSPACE");
    await model.setNodesVisibility([nodeId], !visibility, isIfcSpace ? false : null);
  }
  updateTypesVisibilityIcons() {
    const model = this._viewer.model;
    const typeIds = model.getGenericTypeIdMap();
    typeIds.forEach((nodeIds, type) => {
      let partHidden = false;
      let partShown = false;
      nodeIds.forEach((nodeId) => {
        const elem2 = $(`#visibility${TreeSeparator}${getComponentPartId(nodeId)}`);
        elem2.removeClass("partHidden");
        if (model.getNodeVisibility(nodeId)) {
          partShown = true;
        } else {
          partHidden = true;
          elem2.addClass("partHidden");
        }
      });
      const elem = $(`#visibility${TreeSeparator}${getGenericTypeId(type)}`);
      elem.removeClass(["partHidden", "partialHidden"]);
      if (partHidden && partShown) {
        elem.addClass("partialHidden");
      } else if (partHidden) {
        elem.addClass("partHidden");
      }
    });
  }
  // handles a visibility click for a top level folder in the layers tree
  async _processLayerVisibilityClick(htmlId) {
    const layerName = this._parseVisibilityLayerName(htmlId);
    if (!layerName) {
      return;
    }
    let visibility = false;
    const nodeIds = this._viewer.model.getNodesFromLayerName(layerName, true);
    if (nodeIds !== null) {
      for (let i = 0; i < nodeIds.length; ++i) {
        visibility = visibility || this._viewer.model.getNodeVisibility(nodeIds[i]);
        if (visibility) {
          break;
        }
      }
      _filterActiveSheetNodeIds(this._viewer, nodeIds);
      if (nodeIds.length > 0) {
        await this._viewer.model.setNodesVisibility(nodeIds, !visibility, null);
      }
    }
  }
  // handles a visibility click for a child of a top level folder in the layers tree
  async _processLayerPartVisibilityClick(htmlId) {
    const nodeId = this._parseVisibilityLayerNodeId(htmlId);
    if (nodeId !== null) {
      const visibility = this._viewer.model.getNodeVisibility(nodeId);
      const nodeIds = [nodeId];
      _filterActiveSheetNodeIds(this._viewer, nodeIds);
      if (nodeIds.length > 0) {
        await this._viewer.model.setNodesVisibility(nodeIds, !visibility, null);
      }
    }
  }
  updateLayersVisibilityIcons() {
    const layerNames = this._viewer.model.getUniqueLayerNames();
    layerNames.forEach((layerName) => {
      const nodeIds = this._viewer.model.getNodesFromLayerName(layerName, true);
      if (nodeIds !== null) {
        let partHidden = false;
        let partShown = false;
        for (let i = 0; i < nodeIds.length; ++i) {
          let id = nodeIds[i];
          if (!this._viewer.model.isDrawing()) {
            id = this._viewer.model.getNodeParent(nodeIds[i]);
          }
          if (id !== null) {
            const elem2 = $(`#visibility${TreeSeparator}${TreeGetLayerPartId(id)}`);
            elem2.removeClass("partHidden");
            if (this._viewer.model.getNodeVisibility(nodeIds[i])) {
              partShown = true;
            } else {
              partHidden = true;
              elem2.addClass("partHidden");
            }
          }
        }
        const elem = $(`#visibility${TreeSeparator}${TreeGetLayerId(layerName)}`);
        elem.removeClass(["partHidden", "partialHidden"]);
        if (partHidden && partShown) {
          elem.addClass("partialHidden");
        } else if (partHidden) {
          elem.addClass("partHidden");
        }
      }
    });
  }
  // update the visibility icons in the measurement folder
  updateMeasurementVisibilityIcons() {
    const measureItems = this._viewer.measureManager.getAllMeasurements();
    let hiddenCount = 0;
    for (const measureItem of measureItems) {
      const visibility = measureItem.getVisibility();
      const elem = $(
        `#visibility${TreeSeparator}measurement${TreeSeparator}${measureItem._getId()}`
      );
      if (!visibility) {
        hiddenCount++;
        elem.addClass("partHidden");
      } else {
        elem.removeClass("partHidden");
      }
    }
    const measurementFolder = $(`#visibility${TreeSeparator}measurementitems`);
    if (hiddenCount === measureItems.length) {
      measurementFolder.removeClass("partialHidden");
      measurementFolder.addClass("partHidden");
    } else if (hiddenCount > 0 && hiddenCount < measureItems.length) {
      measurementFolder.removeClass("partHidden");
      measurementFolder.addClass("partialHidden");
    } else {
      measurementFolder.removeClass("partialHidden");
      measurementFolder.removeClass("partHidden");
    }
    this._viewer.markupManager.updateLater();
  }
  _init() {
    const container = document.getElementById(this._elementId);
    if (container === null) {
      throw new CommunicatorError("container is null");
    }
    this._partVisibilityRoot.classList.add("ui-visibility-toggle");
    container.appendChild(this._partVisibilityRoot);
    this._listRoot.classList.add("ui-modeltree");
    this._listRoot.classList.add("ui-modeltree-item");
    container.appendChild(this._listRoot);
    $(container).on("click", ".ui-modeltree-label", (event) => {
      this._processLabelClick(event);
    });
    $(container).on("click", ".ui-modeltree-relationships-label", (event) => {
      this._processLabelRSClick(event);
    });
    $(container).on("click", ".ui-model-tree-relationships-button", (event) => {
      this._processLabelRSClickButton(event);
    });
    $(container).on("click", ".ui-modeltree-expandNode", (event) => {
      this._processExpandClick(event);
    });
    $(container).on("click", ".ui-modeltree-partVisibility-icon", async (event) => {
      const $target = jQuery(event.target);
      const $listItem = $target.closest(".ui-modeltree-item");
      const htmlId = $listItem[0].id;
      await this._processVisibilityClick(htmlId);
    });
    $(container).on("click", "#contextMenuButton", (event) => {
      this._processLabelContext(event);
    });
    $(container).on("mouseup", ".ui-modeltree-label, .ui-modeltree-icon", (event) => {
      if (event.button === 2)
        this._processLabelContext(event);
    });
    $(container).on("touchstart", (event) => {
      this._touchTimer.set(1e3, () => {
        const e = event.originalEvent;
        const x = e.touches[0].pageX;
        const y = e.touches[0].pageY;
        const position = new Point2(x, y);
        this._processLabelContext(event, position);
      });
    });
    $(container).on("touchmove", (_event) => {
      this._touchTimer.clear();
    });
    $(container).on("touchend", (_event) => {
      this._touchTimer.clear();
    });
    $(container).on("contextmenu", ".ui-modeltree-label", (event) => {
      event.preventDefault();
    });
  }
  _getChildItemsFromModelTreeItem($modeltreeItem) {
    const $childItems = $modeltreeItem.children(".ui-modeltree-children").children(".ui-modeltree-item");
    return $.makeArray($childItems);
  }
};
let TreeControl = _TreeControl;
/**
 * Increased by automated tests for more consistent behavior.
 * @hidden
 */
__publicField(TreeControl, "_ScrollToItemDelayMs", 10);
export {
  TreeControl
};
