var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { ScreenConfiguration, CommunicatorError, DrawMode, SnapshotConfig, OperatorId, ViewOrientation, Projection, Point3, DefaultTransitionDuration } from "@hoops/web-viewer";
import { ViewerSettings } from "../desktop/ViewerSettings.js";
import { CuttingSectionIndex, Status } from "./cutting-plane/types.js";
class Toolbar {
  constructor(viewer, cuttingPlaneController, screenConfiguration = ScreenConfiguration.Desktop) {
    __publicField(this, "_viewer");
    __publicField(this, "_noteTextManager");
    __publicField(this, "_cuttingPlaneController");
    __publicField(this, "_viewerSettings");
    __publicField(this, "_toolbarSelector", "#toolBar");
    __publicField(this, "_screenElementSelector", "#content");
    __publicField(this, "_cuttingPlaneXSelector", "#cuttingplane-x");
    __publicField(this, "_cuttingPlaneYSelector", "#cuttingplane-y");
    __publicField(this, "_cuttingPlaneZSelector", "#cuttingplane-z");
    __publicField(this, "_cuttingPlaneFaceSelector", "#cuttingplane-face");
    __publicField(this, "_cuttingPlaneVisibilitySelector", "#cuttingplane-section");
    __publicField(this, "_cuttingPlaneGroupToggle", "#cuttingplane-toggle");
    __publicField(this, "_cuttingPlaneResetSelector", "#cuttingplane-reset");
    __publicField(this, "_selectedClass", "selected");
    __publicField(this, "_disabledClass", "disabled");
    __publicField(this, "_invertedClass", "inverted");
    __publicField(this, "_submenuHeightOffset", 10);
    __publicField(this, "_viewOrientationDuration", 500);
    __publicField(this, "_activeSubmenu", null);
    __publicField(this, "_actionsNullary", /* @__PURE__ */ new Map());
    __publicField(this, "_actionsBoolean", /* @__PURE__ */ new Map());
    __publicField(this, "_isInitialized", false);
    __publicField(this, "_screenConfiguration");
    this._viewer = viewer;
    this._noteTextManager = this._viewer.noteTextManager;
    this._screenConfiguration = screenConfiguration;
    this._cuttingPlaneController = cuttingPlaneController;
    this._viewerSettings = new ViewerSettings(viewer);
    this._viewer.setCallbacks({
      selectionArray: (events) => {
        if (events.length > 0) {
          const selection = events[events.length - 1];
          const selectionItem = selection.getSelection();
          if (selectionItem !== null && selectionItem.isFaceSelection()) {
            $(this._cuttingPlaneFaceSelector).removeClass(this._disabledClass);
            $("#view-face").removeClass(this._disabledClass);
          }
        } else {
          $(this._cuttingPlaneFaceSelector).addClass(this._disabledClass);
          $("#view-face").addClass(this._disabledClass);
        }
      },
      cuttingSectionsLoaded: () => {
        return this._cuttingPlaneController.onSectionsChanged().then(() => {
          this._updateCuttingPlaneIcons();
        });
      }
    });
  }
  init() {
    if (this._isInitialized)
      return;
    this._initIcons();
    this._removeNonApplicableIcons();
    $(".hoops-tool").on("click", (event) => {
      event.preventDefault();
      this._processButtonClick(event);
      return false;
    });
    $(".submenu-icon").on("click", (event) => {
      event.preventDefault();
      this._submenuIconClick(event.target);
      return false;
    });
    $(this._toolbarSelector).on("touchmove", (event) => {
      if (event.originalEvent)
        event.originalEvent.preventDefault();
    });
    $(this._toolbarSelector).on("mouseenter", () => {
      this._mouseEnter();
    });
    $(this._toolbarSelector).on("mouseleave", () => {
      this._mouseLeave();
    });
    $(".tool-icon, .submenu-icon").on("mouseenter", (event) => {
      this._mouseEnterItem(event);
    });
    $(".tool-icon, .submenu-icon").on("mouseleave", (event) => {
      this._mouseLeaveItem(event);
    });
    $(window).on("resize", () => {
      this.reposition();
    });
    $(this._toolbarSelector).on("click", () => {
      if (this._activeSubmenu !== null) {
        this._hideActiveSubmenu();
      }
    });
    $(".toolbar-cp-plane").on("click", async (event) => {
      await this._cuttingPlaneButtonClick(event);
    });
    this._viewer.setCallbacks({
      modelSwitched: () => {
        this._hideActiveSubmenu();
      }
    });
    this._initSliders();
    this._initActions();
    this._initSnapshot();
    this.updateEdgeFaceButton();
    this.reposition();
    this.show();
    this._isInitialized = true;
  }
  /** @hidden */
  _getViewerSettings() {
    return this._viewerSettings;
  }
  disableSubmenuItem(item) {
    if (typeof item === "string") {
      $(`#submenus .toolbar-${item}`).addClass(this._disabledClass);
    } else if (typeof item === "object") {
      $.each(item, (_key, value) => {
        $(`#submenus .toolbar-${value}`).addClass(this._disabledClass);
      });
    }
  }
  enableSubmenuItem(item) {
    if (typeof item === "string") {
      $(`#submenus .toolbar-${item}`).removeClass(this._disabledClass);
    } else if (typeof item === "object") {
      $.each(item, (_key, value) => {
        $(`#submenus .toolbar-${value}`).removeClass(this._disabledClass);
      });
    }
  }
  setCorrespondingButtonForSubmenuItem(value) {
    const $item = $(`#submenus .toolbar-${value}`);
    this._activateSubmenuItem($item);
  }
  _mouseEnterItem(event) {
    const $target = $(event.target);
    if (!$target.hasClass(this._disabledClass))
      $target.addClass("hover");
  }
  _mouseLeaveItem(event) {
    $(event.target).removeClass("hover");
  }
  show() {
    $(this._toolbarSelector).show();
  }
  hide() {
    $(this._toolbarSelector).hide();
  }
  _initSliders() {
    $("#explosion-slider").slider({
      orientation: "vertical",
      min: 0,
      max: 200,
      value: 0,
      slide: async (_event, ui) => {
        await this._onExplosionSlider((ui.value || 0) / 100);
      }
    });
  }
  _mouseEnter() {
    if (this._activeSubmenu === null) {
      const $tools = $(this._toolbarSelector).find(".toolbar-tools");
      $tools.stop();
      $tools.css({
        opacity: 1
      });
    }
  }
  _mouseLeave() {
    if (this._activeSubmenu === null) {
      $(".toolbar-tools").animate(
        {
          opacity: 0.6
        },
        500,
        () => {
        }
      );
    }
  }
  reposition() {
    const $toolbar = $(this._toolbarSelector);
    const $screen = $(this._screenElementSelector);
    if ($toolbar !== void 0 && $screen !== void 0) {
      const screenWidth = $screen.width();
      const toolbarWidth = $toolbar.width();
      if (toolbarWidth !== void 0 && screenWidth !== void 0) {
        const canvasCenterX = screenWidth / 2;
        const toolbarX = canvasCenterX - toolbarWidth / 2;
        $toolbar.css({
          left: `${toolbarX}px`,
          bottom: "15px"
        });
      }
    }
  }
  _processButtonClick(event) {
    if (this._activeSubmenu !== null) {
      this._hideActiveSubmenu();
    } else {
      if (event !== null) {
        const target = event.target;
        const $tool = $(target).closest(".hoops-tool");
        if ($tool.hasClass("toolbar-radio")) {
          if ($tool.hasClass("active-tool")) {
            this._showSubmenu(target);
          } else {
            $(this._toolbarSelector).find(".active-tool").removeClass("active-tool");
            $tool.addClass("active-tool");
            this._performNullaryAction($tool.data("operatorclass"));
          }
        } else if ($tool.hasClass("toolbar-menu")) {
          this._showSubmenu(target);
        } else if ($tool.hasClass("toolbar-menu-toggle")) {
          this._toggleMenuTool($tool);
        } else {
          this._performNullaryAction($tool.data("operatorclass"));
        }
      }
    }
  }
  _toggleMenuTool($tool) {
    const $toggleMenu = $(`#${$tool.data("submenu")}`);
    if ($toggleMenu.is(":visible")) {
      $toggleMenu.hide();
      this._performBooleanAction($tool.data("operatorclass"), false);
    } else {
      this._alignMenuToTool($toggleMenu, $tool);
      this._performBooleanAction($tool.data("operatorclass"), true);
    }
  }
  _startModal() {
    $("body").append("<div id='toolbar-modal' class='toolbar-modal-overlay'></div>");
    $("#toolbar-modal").on("click", () => {
      this._hideActiveSubmenu();
    });
  }
  _alignMenuToTool($submenu, $tool) {
    const position = $tool.position();
    let leftPositionOffset = position.left;
    if (this._screenConfiguration === ScreenConfiguration.Mobile) {
      const mobileScale = 1.74;
      leftPositionOffset = leftPositionOffset / mobileScale;
    }
    const submenuWidth = $submenu.width();
    const submenuHeight = $submenu.height();
    if (submenuWidth !== void 0 && submenuHeight !== void 0) {
      const leftpos = leftPositionOffset - submenuWidth / 2 + 20;
      const topPos = -(this._submenuHeightOffset + submenuHeight);
      $submenu.css({
        display: "block",
        left: `${leftpos}px`,
        top: `${topPos}px`
      });
    }
  }
  _showSubmenu(item) {
    this._hideActiveSubmenu();
    const $tool = $(item).closest(".hoops-tool");
    const submenuId = $tool.data("submenu");
    if (submenuId) {
      const $submenu = $(`${this._toolbarSelector} #submenus #${submenuId}`);
      if (!$submenu.hasClass(this._disabledClass)) {
        this._alignMenuToTool($submenu, $tool);
        this._activeSubmenu = $submenu[0];
        this._startModal();
        $(this._toolbarSelector).find(".toolbar-tools").css({
          opacity: 0.3
        });
      }
    }
  }
  _hideActiveSubmenu() {
    $("#toolbar-modal").remove();
    if (this._activeSubmenu !== null) {
      $(this._activeSubmenu).hide();
      $(this._toolbarSelector).find(".toolbar-tools").css({
        opacity: 1
      });
    }
    this._activeSubmenu = null;
  }
  _activateSubmenuItem(submenuItem) {
    const $submenu = submenuItem.closest(".toolbar-submenu");
    const action = submenuItem.data("operatorclass");
    if (typeof action !== "string") {
      throw new CommunicatorError("Invalid submenuItem.");
    }
    const $tool = $(`#${$submenu.data("button")}`);
    const $icon = $tool.find(".tool-icon");
    if ($icon.length) {
      $icon.removeClass($tool.data("operatorclass").toString());
      $icon.addClass(action);
      $tool.data("operatorclass", action);
      const title = submenuItem.attr("title");
      if (title !== void 0) {
        $tool.attr("title", title);
      }
    }
    return action;
  }
  _submenuIconClick(item) {
    const $selection = $(item);
    if ($selection.hasClass(this._disabledClass))
      return;
    const action = this._activateSubmenuItem($selection);
    this._hideActiveSubmenu();
    this._performNullaryAction(action);
  }
  _initIcons() {
    $(this._toolbarSelector).find(".hoops-tool").each(function() {
      const $element = $(this);
      $element.find(".tool-icon").addClass($element.data("operatorclass").toString());
    });
    $(this._toolbarSelector).find(".submenu-icon").each(function() {
      const $element = $(this);
      $element.addClass($element.data("operatorclass").toString());
    });
  }
  _removeNonApplicableIcons() {
    if (this._screenConfiguration === ScreenConfiguration.Mobile) {
      $("#snapshot-button").remove();
    }
  }
  setSubmenuEnabled(buttonId, enabled) {
    const $button = $(`#${buttonId}`);
    const $submenu = $(`#${$button.data("submenu")}`);
    if (enabled) {
      $button.find(".smarrow").show();
      $submenu.removeClass(this._disabledClass);
    } else {
      $button.find(".smarrow").hide();
      $submenu.addClass(this._disabledClass);
    }
  }
  _performNullaryAction(action) {
    const func = this._actionsNullary.get(action);
    if (func) {
      func();
    }
  }
  _performBooleanAction(action, arg) {
    const func = this._actionsBoolean.get(action);
    if (func) {
      func(arg);
    }
  }
  _renderModeClick(action) {
    const view = this._viewer.view;
    switch (action) {
      case "toolbar-shaded":
        view.setDrawMode(DrawMode.Shaded);
        break;
      case "toolbar-wireframe":
        view.setDrawMode(DrawMode.Wireframe);
        break;
      case "toolbar-hidden-line":
        view.setDrawMode(DrawMode.HiddenLine);
        break;
      case "toolbar-xray":
        view.setDrawMode(DrawMode.XRay);
        break;
      default:
      case "toolbar-wireframeshaded":
        view.setDrawMode(DrawMode.WireframeOnShaded);
        break;
    }
  }
  _initSnapshot() {
    $("#snapshot-dialog-cancel-button").button().on("click", () => {
      $("#snapshot-dialog").hide();
    });
  }
  async _doSnapshot() {
    const canvasSize = this._viewer.view.getCanvasSize();
    const windowAspect = canvasSize.x / canvasSize.y;
    let renderHeight = 480;
    let renderWidth = windowAspect * renderHeight;
    const $screen = $("#content");
    const windowWidth = $screen.width();
    const windowHeight = $screen.height();
    const percentageOfWindow = 0.7;
    if (windowHeight !== void 0 && windowWidth !== void 0) {
      renderHeight = windowHeight * percentageOfWindow;
      renderWidth = windowWidth * percentageOfWindow;
      const dialogWidth = renderWidth + 40;
      const config = new SnapshotConfig(canvasSize.x, canvasSize.y);
      const image = await this._viewer.takeSnapshot(config);
      const xpos = (windowWidth - renderWidth) / 2;
      const $dialog = $("#snapshot-dialog");
      $("#snapshot-dialog-image").attr("src", image.src).attr("width", dialogWidth).attr("height", renderHeight + 40);
      $dialog.css({
        top: "45px",
        left: `${xpos}px`
      });
      $dialog.show();
    }
  }
  _setRedlineOperator(operatorId) {
    this._viewer.operatorManager.set(operatorId, 1);
  }
  _initActions() {
    const view = this._viewer.view;
    const operatorManager = this._viewer.operatorManager;
    this._actionsNullary.set("toolbar-home", () => {
      this._viewer.reset();
      if (!this._viewer.sheetManager.isDrawingSheetActive()) {
        this._noteTextManager.setIsolateActive(false);
        this._noteTextManager.updatePinVisibility();
        const handleOperator = operatorManager.getOperator(OperatorId.Handle);
        if (handleOperator !== null && handleOperator.removeHandles) {
          handleOperator.removeHandles();
        }
      }
    });
    this._actionsNullary.set("toolbar-redline-circle", () => {
      this._setRedlineOperator(OperatorId.RedlineCircle);
    });
    this._actionsNullary.set("toolbar-redline-freehand", () => {
      this._setRedlineOperator(OperatorId.RedlinePolyline);
    });
    this._actionsNullary.set("toolbar-redline-rectangle", () => {
      this._setRedlineOperator(OperatorId.RedlineRectangle);
    });
    this._actionsNullary.set("toolbar-redline-note", () => {
      this._setRedlineOperator(OperatorId.RedlineText);
    });
    this._actionsNullary.set("toolbar-note", () => {
      operatorManager.set(OperatorId.Note, 1);
    });
    this._actionsNullary.set("toolbar-select", () => {
      operatorManager.set(OperatorId.Select, 1);
    });
    this._actionsNullary.set("toolbar-area-select", () => {
      operatorManager.set(OperatorId.AreaSelect, 1);
    });
    this._actionsNullary.set("toolbar-orbit", () => {
      operatorManager.set(OperatorId.Navigate, 0);
    });
    this._actionsNullary.set("toolbar-turntable", () => {
      operatorManager.set(OperatorId.Turntable, 0);
    });
    this._actionsNullary.set("toolbar-walk", () => {
      operatorManager.set(OperatorId.WalkMode, 0);
    });
    this._actionsNullary.set("toolbar-face", () => {
      this._orientToFace();
    });
    this._actionsNullary.set("toolbar-measure-point", () => {
      operatorManager.set(OperatorId.MeasurePointPointDistance, 1);
    });
    this._actionsNullary.set("toolbar-measure-edge", () => {
      operatorManager.set(OperatorId.MeasureEdgeLength, 1);
    });
    this._actionsNullary.set("toolbar-measure-distance", () => {
      operatorManager.set(OperatorId.MeasureFaceFaceDistance, 1);
    });
    this._actionsNullary.set("toolbar-measure-angle", () => {
      operatorManager.set(OperatorId.MeasureFaceFaceAngle, 1);
    });
    this._actionsNullary.set("toolbar-cuttingplane", () => {
      return;
    });
    this._actionsBoolean.set("toolbar-explode", (visibility) => {
      this._explosionButtonClick(visibility);
    });
    this._actionsNullary.set("toolbar-settings", () => {
      this._settingsButtonClick();
    });
    this._actionsNullary.set("toolbar-wireframeshaded", () => {
      this._renderModeClick("toolbar-wireframeshaded");
    });
    this._actionsNullary.set("toolbar-shaded", () => {
      this._renderModeClick("toolbar-shaded");
    });
    this._actionsNullary.set("toolbar-wireframe", () => {
      this._renderModeClick("toolbar-wireframe");
    });
    this._actionsNullary.set("toolbar-hidden-line", () => {
      this._renderModeClick("toolbar-hidden-line");
    });
    this._actionsNullary.set("toolbar-xray", () => {
      this._renderModeClick("toolbar-xray");
    });
    this._actionsNullary.set("toolbar-front", () => {
      view.setViewOrientation(ViewOrientation.Front, this._viewOrientationDuration);
    });
    this._actionsNullary.set("toolbar-back", () => {
      view.setViewOrientation(ViewOrientation.Back, this._viewOrientationDuration);
    });
    this._actionsNullary.set("toolbar-left", () => {
      view.setViewOrientation(ViewOrientation.Left, this._viewOrientationDuration);
    });
    this._actionsNullary.set("toolbar-right", () => {
      view.setViewOrientation(ViewOrientation.Right, this._viewOrientationDuration);
    });
    this._actionsNullary.set("toolbar-bottom", () => {
      view.setViewOrientation(ViewOrientation.Bottom, this._viewOrientationDuration);
    });
    this._actionsNullary.set("toolbar-top", () => {
      view.setViewOrientation(ViewOrientation.Top, this._viewOrientationDuration);
    });
    this._actionsNullary.set("toolbar-iso", () => {
      view.setViewOrientation(ViewOrientation.Iso, this._viewOrientationDuration);
    });
    this._actionsNullary.set("toolbar-ortho", () => {
      view.setProjectionMode(Projection.Orthographic);
    });
    this._actionsNullary.set("toolbar-persp", () => {
      view.setProjectionMode(Projection.Perspective);
    });
    this._actionsNullary.set("toolbar-snapshot", () => {
      this._doSnapshot();
    });
  }
  _onExplosionSlider(value) {
    return this._viewer.explodeManager.setMagnitude(value);
  }
  _explosionButtonClick(visibility) {
    const explodeManager = this._viewer.explodeManager;
    if (visibility && !explodeManager.getActive()) {
      return explodeManager.start();
    }
    return Promise.resolve();
  }
  _settingsButtonClick() {
    return this._viewerSettings.show();
  }
  updateEdgeFaceButton() {
    const view = this._viewer.view;
    const edgeVisibility = view.getLineVisibility();
    const faceVisibility = view.getFaceVisibility();
    if (edgeVisibility && faceVisibility)
      this.setCorrespondingButtonForSubmenuItem("wireframeshaded");
    else if (!edgeVisibility && faceVisibility)
      this.setCorrespondingButtonForSubmenuItem("shaded");
    else
      this.setCorrespondingButtonForSubmenuItem("wireframe");
  }
  _cuttingPlaneButtonClick(event) {
    const $element = $(event.target).closest(".toolbar-cp-plane");
    const planeAction = $element.data("plane");
    let p;
    const axis = this._getAxis(planeAction);
    if (axis !== null) {
      p = this._cuttingPlaneController.toggle(axis);
    } else if (planeAction === "section") {
      p = this._cuttingPlaneController.toggleReferenceGeometry();
    } else if (planeAction === "toggle") {
      p = this._cuttingPlaneController.toggleCuttingMode();
    } else if (planeAction === "reset") {
      p = this._cuttingPlaneController.resetCuttingPlanes();
    } else {
      p = Promise.resolve();
    }
    return p.then(() => {
      this._updateCuttingPlaneIcons();
    });
  }
  _getAxis(planeAxis) {
    switch (planeAxis) {
      case "x":
        return CuttingSectionIndex.X;
      case "y":
        return CuttingSectionIndex.Y;
      case "z":
        return CuttingSectionIndex.Z;
      case "face":
        return CuttingSectionIndex.Face;
      default:
        return null;
    }
  }
  _updateCuttingPlaneIcons() {
    const geometryEnabled = this._cuttingPlaneController.getReferenceGeometryEnabled();
    const individualCuttingSection = this._cuttingPlaneController.individualCuttingSectionEnabled;
    const count = this._cuttingPlaneController.getCount();
    this._updateCuttingPlaneIcon(CuttingSectionIndex.X, this._cuttingPlaneXSelector);
    this._updateCuttingPlaneIcon(CuttingSectionIndex.Y, this._cuttingPlaneYSelector);
    this._updateCuttingPlaneIcon(CuttingSectionIndex.Z, this._cuttingPlaneZSelector);
    this._updateCuttingPlaneIcon(CuttingSectionIndex.Face, this._cuttingPlaneFaceSelector);
    if (individualCuttingSection) {
      $(this._cuttingPlaneGroupToggle).removeClass(this._selectedClass);
    } else {
      $(this._cuttingPlaneGroupToggle).addClass(this._selectedClass);
    }
    if (count > 0) {
      if (geometryEnabled) {
        $(this._cuttingPlaneVisibilitySelector).removeClass(this._selectedClass);
      } else {
        $(this._cuttingPlaneVisibilitySelector).addClass(this._selectedClass);
      }
      $(this._cuttingPlaneVisibilitySelector).removeClass(this._disabledClass);
      $(this._cuttingPlaneResetSelector).removeClass(this._disabledClass);
    } else {
      $(this._cuttingPlaneVisibilitySelector).addClass(this._disabledClass);
      $(this._cuttingPlaneResetSelector).addClass(this._disabledClass);
    }
    if (count > 1) {
      $(this._cuttingPlaneGroupToggle).removeClass(this._disabledClass);
    } else {
      $(this._cuttingPlaneGroupToggle).addClass(this._disabledClass);
    }
  }
  _updateCuttingPlaneIcon(sectionIndex, cuttingPlaneSelector) {
    const $cuttingPlaneButton = $(cuttingPlaneSelector);
    $cuttingPlaneButton.removeClass(this._selectedClass);
    $cuttingPlaneButton.removeClass(this._invertedClass);
    const planeStatus = this._cuttingPlaneController.getPlaneStatus(sectionIndex);
    if (planeStatus === Status.Visible) {
      $cuttingPlaneButton.addClass(this._selectedClass);
    } else if (planeStatus === Status.Inverted) {
      $cuttingPlaneButton.addClass(this._invertedClass);
    }
  }
  _orientToFace() {
    const selectionItem = this._viewer.selectionManager.getLast();
    if (selectionItem !== null && selectionItem.isFaceSelection()) {
      const view = this._viewer.view;
      const normal = selectionItem.getFaceEntity().getNormal();
      const position = selectionItem.getPosition();
      const camera = view.getCamera();
      let up = Point3.cross(normal, new Point3(0, 1, 0));
      if (up.length() < 1e-3) {
        up = Point3.cross(normal, new Point3(1, 0, 0));
      }
      const zoomDelta = camera.getPosition().subtract(camera.getTarget()).length();
      camera.setTarget(position);
      camera.setPosition(Point3.add(position, Point3.scale(normal, zoomDelta)));
      camera.setUp(up);
      return view.fitBounding(
        selectionItem.getFaceEntity().getBounding(),
        DefaultTransitionDuration,
        camera
      );
    }
    return Promise.resolve();
  }
}
export {
  Toolbar
};
