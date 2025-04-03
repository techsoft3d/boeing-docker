var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { KeyModifiers, ElementType, OperatorId, Selection } from "@hoops/web-viewer";
import { ContextMenuItem } from "./ContextMenuItem.js";
import { TreeGetLayerName } from "../../desktop/Tree/util.js";
class ContextMenu {
  constructor(menuClass, containerId, viewer, isolateZoomHelper, colorPicker) {
    __publicField(this, "_viewer");
    __publicField(this, "_isolateZoomHelper");
    __publicField(this, "_containerId");
    __publicField(this, "_menuElement");
    __publicField(this, "_contextLayer");
    __publicField(this, "_colorPicker");
    __publicField(this, "_contextItemMap");
    __publicField(this, "_activeItemId", null);
    __publicField(this, "_activeLayerName", null);
    __publicField(this, "_activeType", null);
    __publicField(this, "_separatorCount", 0);
    __publicField(this, "_position", null);
    __publicField(this, "_modifiers", KeyModifiers.None);
    this._viewer = viewer;
    this._containerId = containerId;
    this._isolateZoomHelper = isolateZoomHelper;
    this._colorPicker = colorPicker;
    this._menuElement = this._createMenuElement(menuClass);
    this._contextLayer = this._createContextLayer();
    this._initElements();
    this._viewer.setCallbacks({
      firstModelLoaded: () => {
        this._onNewModel();
      },
      modelSwitched: () => {
        this._onNewModel();
      }
    });
  }
  _getContextItemMap() {
    return this._contextItemMap;
  }
  _onNewModel() {
    if (this._viewer.sheetManager.isDrawingSheetActive()) {
      this._contextItemMap.reset.hide();
      if (this._contextItemMap.meshlevel0 !== void 0)
        this._contextItemMap.meshlevel0.hide();
      if (this._contextItemMap.meshlevel1 !== void 0)
        this._contextItemMap.meshlevel1.hide();
      if (this._contextItemMap.meshlevel2 !== void 0)
        this._contextItemMap.meshlevel2.hide();
      $(".contextmenu-separator-3").hide();
    }
  }
  _isMenuItemEnabled() {
    if (this._activeLayerName !== null || this._activeType !== null || this._activeItemId !== null && !this._viewer.noteTextManager.checkPinInstance(this._activeItemId)) {
      return true;
    }
    const axisOverlay = 1;
    const selectionItems = this._viewer.selectionManager.getResults();
    for (const item of selectionItems) {
      if (item.overlayIndex() !== axisOverlay) {
        return true;
      }
    }
    return false;
  }
  _isMenuItemVisible() {
    const activeItemVisible = this._isItemVisible(this._activeItemId);
    const activeLayerVisible = this._isLayerVisibile(this._activeLayerName);
    const activeTypeVisibile = this._isTypeVisible(this._activeType);
    return activeItemVisible || activeLayerVisible || activeTypeVisibile;
  }
  async _isColorSet(contextItemIds) {
    const activeColor = this._colorPicker.getColor();
    let colorSet = true;
    for (let i = 0; i < contextItemIds.length; ++i) {
      const colorMap = await this._viewer.model.getNodeColorMap(
        contextItemIds[i],
        ElementType.Faces
      );
      if (colorMap.size === 0) {
        return false;
      } else {
        colorMap.forEach((color) => {
          if (!color.equals(activeColor)) {
            colorSet = false;
          }
        });
      }
    }
    return colorSet;
  }
  async _updateMenuItems() {
    const contextItemIds = this.getContextItemIds(true, true, false);
    const menuItemEnabled = this._isMenuItemEnabled();
    const menuItemVisible = this._isMenuItemVisible();
    this._contextItemMap.visibility.setText(menuItemVisible ? "Hide" : "Show");
    this._contextItemMap.visibility.setEnabled(menuItemEnabled);
    this._contextItemMap.isolate.setEnabled(menuItemEnabled);
    this._contextItemMap.zoom.setEnabled(menuItemEnabled);
    this._contextItemMap.transparent.setEnabled(menuItemEnabled);
    this._contextItemMap.setColor.setText(
      `${await this._isColorSet(contextItemIds) ? "Uns" : "S"}et Color`
    );
    const handleOperator = this._viewer.operatorManager.getOperator(OperatorId.Handle);
    if (handleOperator && handleOperator.isEnabled && menuItemEnabled) {
      const enableHandles = contextItemIds.length > 0 && handleOperator.isEnabled();
      this._contextItemMap.handles.setEnabled(enableHandles);
    } else {
      this._contextItemMap.handles.setEnabled(false);
    }
    if (this._contextItemMap.meshlevel0 !== void 0) {
      this._contextItemMap.meshlevel0.setEnabled(menuItemEnabled);
    }
    if (this._contextItemMap.meshlevel1 !== void 0) {
      this._contextItemMap.meshlevel1.setEnabled(menuItemEnabled);
    }
    if (this._contextItemMap.meshlevel2 !== void 0) {
      this._contextItemMap.meshlevel2.setEnabled(menuItemEnabled);
    }
  }
  async setActiveLayerName(layerName) {
    this._activeLayerName = TreeGetLayerName(layerName);
    await this._updateMenuItems();
  }
  async setActiveType(genericType) {
    this._activeType = genericType;
    await this._updateMenuItems();
  }
  async setActiveItemId(activeItemId) {
    this._activeItemId = activeItemId;
    await this._updateMenuItems();
  }
  showElements(position) {
    this._viewer.setContextMenuStatus(true);
    const canvasSize = this._viewer.view.getCanvasSize();
    const menuElement = $(this._menuElement);
    const menuWidth = menuElement.outerWidth();
    const menuHeight = menuElement.outerHeight();
    if (menuHeight !== void 0 && menuWidth !== void 0) {
      if (menuHeight > canvasSize.y) {
        menuElement.addClass("small");
      }
      let positionY = position.y;
      let positionX = position.x;
      if (positionY + menuHeight > canvasSize.y) {
        positionY = canvasSize.y - menuHeight - 1;
      }
      if (positionX + menuWidth > canvasSize.x) {
        positionX = canvasSize.x - menuWidth - 1;
      }
      $(this._menuElement).css({
        left: `${positionX}px`,
        top: `${positionY}px`,
        display: "block"
      });
    }
    $(this._menuElement).show();
    $(this._contextLayer).show();
  }
  _onContextLayerClick(event) {
    if (event.button === 0)
      this.hide();
  }
  hide() {
    this._viewer.setContextMenuStatus(false);
    this._activeItemId = null;
    this._activeLayerName = null;
    this._activeType = null;
    $(this._menuElement).hide();
    $(this._contextLayer).hide();
    $(this._menuElement).removeClass("small");
  }
  async action(action) {
    const contextMenuItem = this._contextItemMap[action];
    if (contextMenuItem !== void 0) {
      await contextMenuItem.action();
    }
  }
  _doMenuClick(event) {
    const $target = $(event.target);
    if ($target.hasClass("disabled"))
      return;
    const itemId = $target.attr("id");
    if (itemId !== void 0) {
      this.action(itemId);
    }
    this.hide();
  }
  _createMenuElement(menuClass) {
    const menuElement = document.createElement("div");
    menuElement.classList.add("ui-contextmenu");
    menuElement.classList.add(menuClass);
    menuElement.style.position = "absolute";
    menuElement.style.zIndex = "6";
    menuElement.style.display = "none";
    menuElement.oncontextmenu = () => {
      return false;
    };
    menuElement.ontouchmove = (event) => {
      event.preventDefault();
    };
    $(menuElement).on("click", ".ui-contextmenu-item", (event) => {
      this._doMenuClick(event);
    });
    return menuElement;
  }
  _createContextLayer() {
    const contextLayer = document.createElement("div");
    contextLayer.style.position = "relative";
    contextLayer.style.width = "100%";
    contextLayer.style.height = "100%";
    contextLayer.style.backgroundColor = "transparent";
    contextLayer.style.zIndex = "5";
    contextLayer.style.display = "none";
    contextLayer.oncontextmenu = () => {
      return false;
    };
    contextLayer.ontouchmove = (event) => {
      event.preventDefault();
    };
    $(contextLayer).on("mousedown", (event) => {
      this._onContextLayerClick(event);
    });
    return contextLayer;
  }
  _initElements() {
    this._createDefaultMenuItems();
    const container = document.getElementById(this._containerId);
    if (container !== null) {
      container.appendChild(this._menuElement);
      container.appendChild(this._contextLayer);
    }
  }
  _isMenuItemExecutable() {
    return this._activeItemId !== null || this._activeLayerName !== null || this._activeType !== null || this._viewer.selectionManager.size() > 0;
  }
  _createDefaultMenuItems() {
    const model = this._viewer.model;
    const operatorManager = this._viewer.operatorManager;
    this._contextItemMap = {};
    const isAllIfcSpace = (nodeIds) => {
      return nodeIds.every((nodeId) => {
        return model.hasEffectiveGenericType(nodeId, "IFCSPACE");
      });
    };
    const isolateFunc = async () => {
      if (this._isMenuItemExecutable()) {
        const nodeIds = this.getContextItemIds(true, true);
        await this._isolateZoomHelper.isolateNodes(nodeIds, isAllIfcSpace(nodeIds) ? false : null);
      }
    };
    const zoomFunc = async () => {
      if (this._isMenuItemExecutable()) {
        await this._isolateZoomHelper.fitNodes(this.getContextItemIds(true, true));
      }
    };
    const visibilityFunc = async () => {
      if (this._isMenuItemExecutable()) {
        const visible = !this._isMenuItemVisible();
        const nodeIds = this.getContextItemIds(true, true);
        await model.setNodesVisibility(nodeIds, visible, isAllIfcSpace(nodeIds) ? false : null);
      }
    };
    const transparentFunc = async () => {
      if (this._isMenuItemExecutable()) {
        const contextItemIds = this.getContextItemIds(true, true);
        const opacityOfFirstItem = (await model.getNodesOpacity([contextItemIds[0]]))[0];
        if (opacityOfFirstItem === null || opacityOfFirstItem === 1) {
          model.setNodesOpacity(contextItemIds, 0.5);
        } else {
          model.resetNodesOpacity(contextItemIds);
        }
      }
    };
    const handlesFunc = async () => {
      if (this._isMenuItemExecutable()) {
        const handleOperator = operatorManager.getOperator(OperatorId.Handle);
        const contextItemIds = this.getContextItemIds(true, true, false);
        if (contextItemIds.length > 0) {
          await handleOperator.addHandles(
            contextItemIds,
            this._modifiers === KeyModifiers.Shift ? null : this._position
          );
        }
      }
    };
    const resetFunc = async () => {
      const handleOperator = operatorManager.getOperator(OperatorId.Handle);
      await handleOperator.removeHandles();
      await model.reset();
      model.unsetNodesFaceColor([model.getAbsoluteRootNode()]);
      model.setPmiColorOverride(model.getPmiColorOverride());
    };
    const meshLevelFunc = (meshLevel) => {
      if (this._isMenuItemExecutable()) {
        model.setMeshLevel(this.getContextItemIds(true, true), meshLevel);
      }
    };
    const showAllFunc = async () => {
      await this._isolateZoomHelper.showAll();
    };
    const setColorFunc = async () => {
      const contextItemIds = this.getContextItemIds(true, true, false);
      if (contextItemIds.length > 0) {
        if (await this._isColorSet(contextItemIds)) {
          this._viewer.model.unsetNodesFaceColor(contextItemIds);
        } else {
          const color = this._colorPicker.getColor().copy();
          this._viewer.model.setNodesFaceColor(contextItemIds, color);
        }
      }
    };
    const modifyColorFunc = async () => {
      this._colorPicker.show();
    };
    this.appendItem("isolate", "Isolate", isolateFunc);
    this.appendItem("zoom", "Zoom", zoomFunc);
    this.appendItem("visibility", "Hide", visibilityFunc);
    this.appendSeparator();
    this.appendItem("transparent", "Transparent", transparentFunc);
    this.appendSeparator();
    this.appendItem("setColor", "Set Color", setColorFunc);
    this.appendItem("modifyColor", "Modify Color", modifyColorFunc);
    this.appendSeparator();
    this.appendItem("handles", "Show Handles", handlesFunc);
    this.appendItem("reset", "Reset Model", resetFunc);
    if (this._viewer.getCreationParameters().hasOwnProperty("model")) {
      this.appendSeparator();
      for (let i = 0; i < 3; ++i) {
        this.appendItem(`meshlevel${i}`, `Mesh Level ${i}`, async () => {
          meshLevelFunc(i);
        });
      }
    }
    this.appendSeparator();
    this.appendItem("showall", "Show all", showAllFunc);
  }
  getContextItemIds(includeSelected, includeClicked, includeRoot = true) {
    const selectionManager = this._viewer.selectionManager;
    const model = this._viewer.model;
    const rootId = model.getAbsoluteRootNode();
    const itemIds = [];
    if (includeSelected) {
      const selectedItems = selectionManager.getResults();
      for (const item of selectedItems) {
        const id = item.getNodeId();
        if (model.isNodeLoaded(id) && (includeRoot || !includeRoot && id !== rootId)) {
          itemIds.push(id);
        }
      }
    }
    if (this._activeLayerName !== null) {
      const layerIds = this._viewer.model.getLayerIdsFromName(this._activeLayerName);
      if (layerIds !== null) {
        for (const layerId of layerIds) {
          const nodeIds = this._viewer.model.getNodesFromLayer(layerId);
          if (nodeIds !== null) {
            for (const nodeId of nodeIds) {
              const selectionItem = Selection.SelectionItem.create(nodeId);
              if (!selectionManager.contains(selectionItem)) {
                itemIds.push(nodeId);
              }
            }
          }
        }
      }
    }
    if (this._activeType !== null) {
      const nodeIds = this._viewer.model.getNodesByGenericType(this._activeType);
      if (nodeIds !== null) {
        nodeIds.forEach((nodeId) => {
          const selectionItem = Selection.SelectionItem.create(nodeId);
          if (!selectionManager.contains(selectionItem)) {
            itemIds.push(nodeId);
          }
        });
      }
    }
    if (this._activeItemId !== null) {
      const selectionItem = Selection.SelectionItem.create(this._activeItemId);
      const containsParent = selectionManager.containsParent(selectionItem) !== null;
      const containsItem = itemIds.indexOf(this._activeItemId) !== -1;
      if (includeClicked && (includeRoot || !includeRoot && this._activeItemId !== rootId && (itemIds.length === 0 || !containsItem && !containsParent))) {
        itemIds.push(this._activeItemId);
      }
    }
    return itemIds;
  }
  appendItem(itemId, label, action) {
    const item = document.createElement("div");
    item.classList.add("ui-contextmenu-item");
    item.innerHTML = label;
    item.id = itemId;
    this._menuElement.appendChild(item);
    const contextMenuItem = new ContextMenuItem(action, item);
    this._contextItemMap[itemId] = contextMenuItem;
    return contextMenuItem;
  }
  appendSeparator() {
    const item = document.createElement("div");
    item.classList.add(`contextmenu-separator-${this._separatorCount++}`);
    item.classList.add("ui-contextmenu-separator");
    item.style.width = "100%";
    item.style.height = "1px";
    this._menuElement.appendChild(item);
  }
  _isItemVisible(nodeId) {
    if (nodeId === null) {
      const selectionItems = this._viewer.selectionManager.getResults();
      if (selectionItems.length === 0) {
        return false;
      }
      nodeId = selectionItems[0].getNodeId();
    }
    return this._viewer.model.getNodeVisibility(nodeId);
  }
  _isLayerVisibile(layerName) {
    if (layerName !== null) {
      const layerIds = this._viewer.model.getLayerIdsFromName(layerName);
      if (layerIds !== null) {
        for (const layerId of layerIds) {
          const nodeIds = this._viewer.model.getNodesFromLayer(layerId);
          if (nodeIds !== null) {
            for (const nodeId of nodeIds) {
              if (this._viewer.model.getNodeVisibility(nodeId)) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }
  _isTypeVisible(genericType) {
    let typeVisible = false;
    if (genericType !== null) {
      const nodeIds = this._viewer.model.getNodesByGenericType(genericType);
      if (nodeIds !== null) {
        nodeIds.forEach((nodeId) => {
          typeVisible = typeVisible || this._viewer.model.getNodeVisibility(nodeId);
        });
      }
    }
    return typeVisible;
  }
}
export {
  ContextMenu
};
