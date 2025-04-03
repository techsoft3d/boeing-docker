var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { Util, Point2, KeyModifiers } from "@hoops/web-viewer";
import { DefaultUiTransitionDuration } from "../../common/UiUtil.js";
import { ModelBrowserContextMenu } from "./ModelBrowserContextMenu.js";
import { ViewTree } from "../Tree/ViewTree.js";
import { BCFTree } from "../Tree/BcfTree.js";
import { CadViewTree } from "../Tree/CADViewTree.js";
import { ConfigurationsTree } from "../Tree/ConfigurationsTree.js";
import { FiltersTree } from "../Tree/FiltersTree.js";
import { LayersTree } from "../Tree/LayersTree.js";
import { ModelTree } from "../Tree/ModelTree.js";
import { RelationshipsTree } from "../Tree/RelationshipsTree.js";
import { SheetsTree } from "../Tree/SheetsTree.js";
import { TypesTree } from "../Tree/TypesTree.js";
import { Tree } from "../Tree/types.js";
class ModelBrowser {
  constructor(elementId, containerId, viewer, isolateZoomHelper, colorPicker, cuttingController) {
    __publicField(this, "_elementId");
    __publicField(this, "_containerId");
    __publicField(this, "_viewer");
    __publicField(this, "_isolateZoomHelper");
    __publicField(this, "_colorPicker");
    __publicField(this, "_contextMenu");
    __publicField(this, "_canvasSize");
    __publicField(this, "_treeMap", /* @__PURE__ */ new Map());
    __publicField(this, "_scrollTreeMap", /* @__PURE__ */ new Map());
    __publicField(this, "_elementIdMap", /* @__PURE__ */ new Map());
    __publicField(this, "_relationshipTree");
    __publicField(this, "_header");
    // assigned in _createHeader()
    __publicField(this, "_content");
    __publicField(this, "_minimizeButton");
    __publicField(this, "_modelBrowserTabs");
    // assigned in _createPropertyWindow()
    __publicField(this, "_propertyWindow");
    __publicField(this, "_treePropertyContainer");
    __publicField(this, "_relationshipsWindow");
    __publicField(this, "_browserWindow");
    __publicField(this, "_browserWindowMargin", 3);
    __publicField(this, "_scrollRefreshTimer", new Util.Timer());
    __publicField(this, "_scrollRefreshTimestamp", 0);
    __publicField(this, "_scrollRefreshInterval", 300);
    __publicField(this, "_minimized", true);
    __publicField(this, "_modelHasRelationships", false);
    this._elementId = elementId;
    this._containerId = containerId;
    this._viewer = viewer;
    this._isolateZoomHelper = isolateZoomHelper;
    this._colorPicker = colorPicker;
    this._canvasSize = this._viewer.view.getCanvasSize();
    this._header = this._createHeader();
    this._browserWindow = this._createBrowserWindow();
    this._createPropertyWindow();
    $(this._browserWindow).resizable({
      resize: (_event, ui) => {
        this.onResize(ui.size.height);
      },
      minWidth: 35,
      minHeight: 37,
      handles: "e"
    });
    this._elementIdMap.set(Tree.Model, "modelTree");
    this._elementIdMap.set(Tree.CadView, "cadViewTree");
    this._elementIdMap.set(Tree.Sheets, "sheetsTree");
    this._elementIdMap.set(Tree.Configurations, "configurationsTree");
    this._elementIdMap.set(Tree.Layers, "layersTree");
    this._elementIdMap.set(Tree.Filters, "filtersTree");
    this._elementIdMap.set(Tree.Types, "typesTree");
    this._elementIdMap.set(Tree.BCF, "bcfTree");
    this._elementIdMap.forEach((elementId2, treeType) => {
      this._addTree(elementId2, treeType, cuttingController);
    });
    this._contextMenu = new ModelBrowserContextMenu(
      this._containerId,
      this._viewer,
      this._treeMap,
      this._isolateZoomHelper,
      this._colorPicker
    );
    this._initEvents();
    this._minimizeModelBrowser();
  }
  _computeRelationshipTreeVisibility(modelRootIds) {
    for (const rootId of modelRootIds) {
      const hasRelationships = this._viewer.model._getModelStructure().hasRelationships(rootId);
      if (!this._modelHasRelationships && hasRelationships) {
        this._modelHasRelationships = true;
        this._updateRelationshipsTreeVisibility();
        return;
      }
    }
  }
  _initEvents() {
    const onModel = (modelRootIds) => {
      this._showTree(Tree.Model);
      this._computeRelationshipTreeVisibility(modelRootIds);
    };
    const onModelSwitched = (_clearOnly, modelRootIds) => {
      onModel(modelRootIds);
    };
    const onSubtreeLoaded = (modelRootIds) => {
      this._computeRelationshipTreeVisibility(modelRootIds);
    };
    this._viewer.setCallbacks({
      modelStructureReady: () => this._onModelStructureReady(),
      assemblyTreeReady: () => {
        this._onAssemblyTreeReady();
      },
      firstModelLoaded: onModel,
      modelSwitched: onModelSwitched,
      frameDrawn: () => {
        this._canvasSize = this._viewer.view.getCanvasSize();
        this.onResize(this._canvasSize.y);
      },
      subtreeLoaded: onSubtreeLoaded
    });
    this._registerScrollRefreshCallbacks();
    $("#contextMenuButton").on("click", (event) => {
      const position = new Point2(event.clientX, event.clientY);
      this._viewer.trigger("contextMenu", position, KeyModifiers.None);
    });
  }
  _registerScrollRefreshCallbacks() {
    this._treeMap.forEach((tree) => {
      if (tree instanceof ViewTree) {
        tree.registerCallback("expand", () => {
          this._refreshBrowserScroll();
        });
        tree.registerCallback("collapse", () => {
          this._refreshBrowserScroll();
        });
        tree.registerCallback("addChild", () => {
          this._refreshBrowserScroll();
        });
      }
    });
    this._relationshipTree.registerCallback("expand", () => {
      this._refreshBrowserScroll();
    });
    this._relationshipTree.registerCallback("collapse", () => {
      this._refreshBrowserScroll();
    });
    this._relationshipTree.registerCallback("addChild", () => {
      this._refreshBrowserScroll();
    });
  }
  _refreshBrowserScroll() {
    const expectedTimestamp = ++this._scrollRefreshTimestamp;
    if (this._scrollRefreshTimer.isIdle(Util.TimerIdleType.BeforeAction)) {
      this._scrollRefreshTimer.set(this._scrollRefreshInterval, () => {
        this._scrollTreeMap.forEach((iScroll) => {
          iScroll.refresh();
        });
        if (expectedTimestamp !== this._scrollRefreshTimestamp) {
          this._refreshBrowserScroll();
        }
      });
    }
  }
  _setPropertyWindowVisibility(visible) {
    if (visible) {
      this._propertyWindow.classList.remove("hidden");
    } else {
      this._propertyWindow.classList.add("hidden");
    }
    this.onResize(this._viewer.view.getCanvasSize().y);
  }
  _updateRelationshipsTreeVisibility() {
    this._setRelationshipsWindowVisibility(this._modelHasRelationships);
  }
  _setRelationshipsWindowVisibility(visible) {
    if (visible) {
      this._relationshipsWindow.classList.remove("hidden");
    } else {
      this._relationshipsWindow.classList.add("hidden");
    }
    this.onResize(this._viewer.view.getCanvasSize().y);
  }
  _setTreeVisibility(tree, visibile) {
    const treeElementId = tree.getElementId();
    const $treeScrollContainer = $(`#${treeElementId}ScrollContainer`);
    const $treeTab = $(`#${treeElementId}Tab`);
    if (visibile) {
      $treeScrollContainer.show();
      $treeTab.addClass("browser-tab-selected");
      if (tree instanceof BCFTree) {
        this._setPropertyWindowVisibility(false);
        this._setRelationshipsWindowVisibility(false);
      } else {
        this._setPropertyWindowVisibility(true);
        this._updateRelationshipsTreeVisibility();
      }
    } else {
      $treeScrollContainer.hide();
      if ($treeTab) {
        $treeTab.removeClass("browser-tab-selected");
      }
    }
  }
  /** @hidden */
  _showTree(activeTreeType) {
    this._treeMap.forEach((viewTree, treeType) => {
      this._setTreeVisibility(viewTree, treeType === activeTreeType);
    });
    this._refreshBrowserScroll();
  }
  _getContextMenu() {
    return this._contextMenu;
  }
  _addTree(elementId, treeType, cuttingController) {
    const iScroll = this._initializeIScroll(elementId);
    this._scrollTreeMap.set(treeType, iScroll);
    let tree;
    if (treeType === Tree.Model) {
      tree = new ModelTree(this._viewer, elementId, iScroll);
    } else if (treeType === Tree.CadView) {
      tree = new CadViewTree(this._viewer, elementId, iScroll, cuttingController);
    } else if (treeType === Tree.Sheets) {
      tree = new SheetsTree(this._viewer, elementId, iScroll);
    } else if (treeType === Tree.Configurations) {
      tree = new ConfigurationsTree(this._viewer, elementId, iScroll);
    } else if (treeType === Tree.Layers) {
      tree = new LayersTree(this._viewer, elementId, iScroll);
    } else if (treeType === Tree.Filters) {
      tree = new FiltersTree(this._viewer, elementId, iScroll);
    } else if (treeType === Tree.Types) {
      tree = new TypesTree(this._viewer, elementId, iScroll);
    } else if (treeType === Tree.BCF) {
      tree = new BCFTree(this._viewer, elementId, iScroll);
    } else if (treeType === Tree.Relationships) {
      tree = new RelationshipsTree(this._viewer, elementId, iScroll);
    } else {
      Util.TypeAssertNever(treeType);
    }
    this._treeMap.set(treeType, tree);
  }
  _createBrowserWindow() {
    const div = document.getElementById(this._elementId);
    $(div).on("touchmove", (event) => {
      if (event.originalEvent)
        event.originalEvent.preventDefault();
    });
    div.classList.add("ui-modelbrowser-window");
    div.classList.add("desktop-ui-window");
    div.classList.add("ui-modelbrowser-small");
    div.style.position = "absolute";
    const width = $(window).width();
    if (width !== void 0) {
      div.style.width = `${Math.max(width / 4, 400)}px`;
    }
    div.style.top = `${this._browserWindowMargin}px`;
    div.style.left = `${this._browserWindowMargin}px`;
    div.appendChild(this._header);
    return div;
  }
  _createDiv(htmlId, classList) {
    const div = document.createElement("div");
    div.id = htmlId;
    for (const clazz of classList) {
      div.classList.add(clazz);
    }
    return div;
  }
  _createHeader() {
    const div = this._createDiv("ui-modelbrowser-header", [
      "ui-modelbrowser-header",
      "desktop-ui-window-header"
    ]);
    const t = document.createElement("table");
    const tr = document.createElement("tr");
    t.appendChild(tr);
    const minimizetd = document.createElement("td");
    minimizetd.classList.add("ui-modelbrowser-minimizetd");
    this._minimizeButton = this._createDiv("ui-modelbrowser-minimizebutton", [
      "ui-modelbrowser-minimizebutton",
      "minimized"
    ]);
    this._minimizeButton.onclick = () => {
      this._onMinimizeButtonClick();
    };
    minimizetd.appendChild(this._minimizeButton);
    tr.appendChild(minimizetd);
    const modelBrowserLabel = document.createElement("td");
    modelBrowserLabel.id = "modelBrowserLabel";
    modelBrowserLabel.innerHTML = "";
    tr.appendChild(modelBrowserLabel);
    const menuNode = this._createDiv("contextMenuButton", ["ui-modeltree-icon", "menu"]);
    tr.appendChild(menuNode);
    div.appendChild(t);
    this._content = this._createDiv("modelTreeContainer", [
      "ui-modelbrowser-content",
      "desktop-ui-window-content"
    ]);
    this._content.style.overflow = "auto";
    const loadingDiv = this._createDiv("modelBrowserLoadingDiv", []);
    loadingDiv.innerHTML = "Loading...";
    this._content.appendChild(loadingDiv);
    this._createIScrollWrapper(this._content, "modelTree");
    this._createIScrollWrapper(this._content, "cadViewTree");
    this._createIScrollWrapper(this._content, "sheetsTree");
    this._createIScrollWrapper(this._content, "configurationsTree");
    this._createIScrollWrapper(this._content, "layersTree");
    this._createIScrollWrapper(this._content, "filtersTree");
    this._createIScrollWrapper(this._content, "typesTree");
    this._createIScrollWrapper(this._content, "bcfTree");
    this._modelBrowserTabs = this._createDiv("modelBrowserTabs", []);
    this._createBrowserTab("modelTreeTab", "Model Tree", true, Tree.Model);
    this._createBrowserTab("cadViewTreeTab", "Views", false, Tree.CadView);
    this._createBrowserTab("sheetsTreeTab", "Sheets", false, Tree.Sheets);
    this._createBrowserTab("configurationsTreeTab", "Configurations", false, Tree.Configurations);
    this._createBrowserTab("layersTreeTab", "Layers", false, Tree.Layers);
    this._createBrowserTab("relationTreeTab", "Relations", false, Tree.Relationships);
    this._createBrowserTab("filtersTreeTab", "Filters", false, Tree.Filters);
    this._createBrowserTab("typesTreeTab", "Types", false, Tree.Types);
    this._createBrowserTab("bcfTreeTab", "BCF", false, Tree.BCF);
    div.appendChild(this._modelBrowserTabs);
    return div;
  }
  _createIScrollWrapper(containerElement, htmlId) {
    const divScrollContainer = this._createDiv(`${htmlId}ScrollContainer`, []);
    divScrollContainer.classList.add("tree-scroll-container");
    divScrollContainer.appendChild(this._createDiv(htmlId, []));
    containerElement.appendChild(divScrollContainer);
  }
  _createBrowserTab(htmlId, name, selected, tree) {
    const tab = document.createElement("label");
    tab.id = htmlId;
    tab.textContent = name;
    tab.classList.add("ui-modelbrowser-tab");
    tab.classList.add("hidden");
    if (selected) {
      tab.classList.add("browser-tab-selected");
    }
    tab.onclick = (_event) => {
      this._showTree(tree);
    };
    this._modelBrowserTabs.appendChild(tab);
    return tab;
  }
  _initializeIScroll(htmlId) {
    const wrapper = $(`#${htmlId}ScrollContainer`).get(0);
    return new IScroll(wrapper, {
      mouseWheel: true,
      scrollbars: true,
      interactiveScrollbars: true,
      preventDefault: false
    });
  }
  _createRelationshipTree(containerElt) {
    this._createIScrollWrapper(containerElt, "relationshipsTree");
    const iScroll = this._initializeIScroll("relationshipsTree");
    this._scrollTreeMap.set(Tree.Relationships, iScroll);
    const relationshipTree = new RelationshipsTree(this._viewer, "relationshipsTree", iScroll);
    this._setTreeVisibility(relationshipTree, true);
    return relationshipTree;
  }
  _createPropertyWindow() {
    this._propertyWindow = document.createElement("div");
    this._propertyWindow.classList.add("propertyWindow");
    this._propertyWindow.id = "propertyWindow";
    const container = document.createElement("div");
    container.id = "propertyContainer";
    this._propertyWindow.appendChild(container);
    this._treePropertyContainer = document.createElement("div");
    this._treePropertyContainer.id = "treePropertyContainer";
    this._relationshipsWindow = document.createElement("div");
    this._relationshipsWindow.classList.add("relationshipsWindow", "hidden");
    this._relationshipsWindow.id = "relationshipsWindow";
    this._treePropertyContainer.appendChild(this._content);
    this._treePropertyContainer.appendChild(this._relationshipsWindow);
    this._treePropertyContainer.appendChild(this._propertyWindow);
    this._browserWindow.appendChild(this._treePropertyContainer);
    this._relationshipTree = this._createRelationshipTree(this._relationshipsWindow);
    $(this._propertyWindow).resizable({
      resize: () => {
        this.onResizeElement(this._viewer.view.getCanvasSize().y, this._relationshipsWindow);
      },
      handles: "n"
    });
    $(this._relationshipsWindow).resizable({
      resize: () => {
        this.onResizeElement(this._viewer.view.getCanvasSize().y, this._content);
      },
      handles: "n"
    });
  }
  _onMinimizeButtonClick() {
    if (!this._minimized) {
      this._minimizeModelBrowser();
    } else {
      this._maximizeModelBrowser();
    }
  }
  _maximizeModelBrowser() {
    this._minimized = false;
    this.freeze(false);
    const $minimizeButton = jQuery(this._minimizeButton);
    $minimizeButton.addClass("maximized");
    $minimizeButton.removeClass("minimized");
    jQuery(this._content).slideDown({
      progress: () => {
        this._onSlide();
        $("#modelBrowserWindow").removeClass("ui-modelbrowser-small");
      },
      complete: () => {
        $(this._browserWindow).children(".ui-resizable-handle").show();
      },
      duration: DefaultUiTransitionDuration
    });
    this._refreshBrowserScroll();
  }
  _minimizeModelBrowser() {
    this._minimized = true;
    this.freeze(true);
    const $minimizeButton = jQuery(this._minimizeButton);
    $minimizeButton.removeClass("maximized");
    $minimizeButton.addClass("minimized");
    jQuery(this._content).slideUp({
      progress: () => {
        this._onSlide();
        $("#modelBrowserWindow").addClass("ui-modelbrowser-small");
      },
      complete: () => {
        $(this._browserWindow).children(".ui-resizable-handle").hide();
      },
      duration: DefaultUiTransitionDuration
    });
    this._refreshBrowserScroll();
  }
  onResize(height) {
    const headerHeight = $(this._header).outerHeight();
    const propertyWindowHeight = $(this._propertyWindow).outerHeight();
    const relationShipsWindowHeight = $(this._relationshipsWindow).outerHeight();
    if (headerHeight !== void 0 && propertyWindowHeight !== void 0 && relationShipsWindowHeight !== void 0) {
      this._treePropertyContainer.style.height = `${height - headerHeight - this._browserWindowMargin * 2}px`;
      const contentHeight = height - headerHeight - propertyWindowHeight - relationShipsWindowHeight - this._browserWindowMargin * 2;
      this._browserWindow.style.height = `${height - this._browserWindowMargin * 2}px`;
      this._content.style.height = `${contentHeight}px`;
      this._refreshBrowserScroll();
    }
  }
  onResizeElement(height, htmlElementToResize) {
    const headerOuterHeight = $(this._header).outerHeight();
    const contentOuterHeight = $(this._content).outerHeight();
    const propertyWindowOuterHeight = $(this._propertyWindow).outerHeight();
    const relationShipsWindowOuterHeight = $(this._relationshipsWindow).outerHeight();
    const elementToResizeHidden = $(htmlElementToResize).hasClass("hidden");
    if (elementToResizeHidden) {
      htmlElementToResize = this._content;
    }
    const elementToResizeOuterHeight = $(htmlElementToResize).outerHeight();
    const elementToResizeHeight = $(htmlElementToResize).height();
    if (headerOuterHeight !== void 0 && propertyWindowOuterHeight !== void 0 && relationShipsWindowOuterHeight !== void 0 && contentOuterHeight !== void 0 && elementToResizeOuterHeight !== void 0 && elementToResizeHeight !== void 0) {
      this._treePropertyContainer.style.height = `${height - headerOuterHeight - this._browserWindowMargin * 2}px`;
      const elementToResizeVerticalPadding = elementToResizeOuterHeight - elementToResizeHeight;
      const elementOuterHeight = height - headerOuterHeight - propertyWindowOuterHeight - relationShipsWindowOuterHeight - contentOuterHeight + elementToResizeOuterHeight - this._browserWindowMargin * 2;
      let elementHeight = elementOuterHeight - elementToResizeVerticalPadding;
      if (elementHeight < 0) {
        elementHeight = 0;
      }
      this._browserWindow.style.height = `${height - this._browserWindowMargin * 2}px`;
      htmlElementToResize.style.height = `${elementHeight}px`;
      this._refreshBrowserScroll();
    }
  }
  _onSlide() {
    const headerHeight = $(this._header).outerHeight();
    const contentHeight = $(this._content).outerHeight();
    const propertyWindowHeight = $(this._propertyWindow).outerHeight();
    const relationShipsWindowHeight = $(this._relationshipsWindow).outerHeight();
    if (headerHeight !== void 0 && contentHeight !== void 0 && propertyWindowHeight !== void 0 && relationShipsWindowHeight !== void 0) {
      const browserWindowHeight = contentHeight + headerHeight + propertyWindowHeight + relationShipsWindowHeight;
      this._browserWindow.style.height = `${browserWindowHeight}px`;
    }
  }
  _onModelStructureReady() {
    const $containerDiv = $(`#${this._elementId}`);
    $containerDiv.show();
  }
  _onAssemblyTreeReady() {
    const $loadingDiv = $("#modelBrowserLoadingDiv");
    $loadingDiv.remove();
    this._showTree(Tree.Model);
    const modelBrowserHeight = $(this._elementId).height();
    if (modelBrowserHeight !== void 0) {
      this.onResize(modelBrowserHeight);
    }
  }
  freeze(freeze) {
    this._getTree(Tree.Model).freezeExpansion(freeze);
  }
  enablePartSelection(enable) {
    this._getTree(Tree.Model).enablePartSelection(enable);
  }
  updateSelection(items) {
    this._getTree(Tree.Model).updateSelection(items);
  }
  /** @hidden */
  _getTree(tree) {
    return this._treeMap.get(tree);
  }
}
export {
  ModelBrowser
};
