var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { Color, ParseError, ScreenConfiguration, OverlayAnchor, OperatorId, RendererType, FileType, DrawMode, ElementType } from "@hoops/web-viewer";
import { ColorPicker } from "../common/ColorPicker.js";
import { IsolateZoomHelper } from "../common/IsolateZoomHelper.js";
import { RightClickContextMenu } from "../common/RightClickContextMenu.js";
import { Toolbar } from "../common/Toolbar.js";
import { Controller } from "../common/cutting-plane/Controller.js";
import { PropertyWindow } from "./PropertyWindow.js";
import { ModelBrowser } from "./model-browser/ModelBrowser.js";
import { ModelType } from "./types.js";
import { StreamingIndicator } from "../common/StreamingIndicator.js";
import { TimeoutWarningDialog } from "../common/TimeoutWarningDialog.js";
import { UiDialog } from "../common/UiDialog.js";
const _DesktopUi = class {
  /**
   * Creates a new Web Viewer instance. You must pass in a **containerId** key with the ID of an element.
   * The system will create any required elements inside the supplied container.
   *
   * @param inputParams object containing key-value pairs for UI options.
   */
  constructor(viewer, inputParams) {
    __publicField(this, "_viewer");
    __publicField(this, "_modelBrowser", null);
    __publicField(this, "_toolbar", null);
    __publicField(this, "contextMenu");
    __publicField(this, "_isolateZoomHelper");
    __publicField(this, "_cuttingPlaneController");
    __publicField(this, "_colorPicker");
    /** The `ModelType` derived from the current model. */
    __publicField(this, "_modelType", ModelType.Generic);
    /** The `ModelType` for which the UI is configured. */
    __publicField(this, "_uiModelType", null);
    __publicField(this, "_suppressMissingModelDialog", false);
    __publicField(this, "_params");
    this._viewer = viewer;
    this._params = { ...inputParams };
    if (this._params.containerId === void 0) {
      throw new ParseError(`Must supply 'containerId'.`);
    }
    this._colorPicker = new ColorPicker(this._viewer, this._params.containerId);
    const screenConfiguration = this._getWithDefault(
      this._params.screenConfiguration,
      ScreenConfiguration.Desktop
    );
    const showModelBrowser = this._getWithDefault(this._params.showModelBrowser, true);
    const showToolbar = this._getWithDefault(this._params.showToolbar, true);
    if (screenConfiguration === ScreenConfiguration.Mobile) {
      const view = this._viewer.view;
      const axisTriad = view.getAxisTriad();
      const navCube = view.getNavCube();
      axisTriad.setAnchor(OverlayAnchor.UpperRightCorner);
      navCube.setAnchor(OverlayAnchor.UpperLeftCorner);
      const bodyElm = document.getElementsByTagName("body")[0];
      bodyElm.classList.add("mobile");
      const handleOperator = this._viewer.operatorManager.getOperator(OperatorId.Handle);
      if (handleOperator) {
        handleOperator.setHandleSize(3);
      }
    }
    this._cuttingPlaneController = new Controller(this._viewer);
    this._isolateZoomHelper = new IsolateZoomHelper(this._viewer);
    if (showToolbar) {
      this._toolbar = new Toolbar(this._viewer, this._cuttingPlaneController, screenConfiguration);
      this._toolbar.init();
    }
    const content = document.getElementById("content");
    content.oncontextmenu = () => {
      return false;
    };
    if (showModelBrowser) {
      const modelBrowserDiv = document.createElement("div");
      modelBrowserDiv.id = "modelBrowserWindow";
      content.appendChild(modelBrowserDiv);
      this._modelBrowser = new ModelBrowser(
        modelBrowserDiv.id,
        content.id,
        this._viewer,
        this._isolateZoomHelper,
        this._colorPicker,
        this._cuttingPlaneController
      );
    }
    new PropertyWindow(this._viewer);
    const streamingIndicatorDiv = document.createElement("div");
    streamingIndicatorDiv.id = "streamingIndicator";
    content.appendChild(streamingIndicatorDiv);
    if (this._viewer.getRendererType() === RendererType.Client) {
      new StreamingIndicator(streamingIndicatorDiv.id, this._viewer);
    }
    this.contextMenu = new RightClickContextMenu(
      content.id,
      this._viewer,
      this._isolateZoomHelper,
      this._colorPicker
    );
    new TimeoutWarningDialog(content.id, this._viewer);
    this._viewer.setCallbacks({
      sceneReady: () => {
        this._onSceneReady();
      },
      firstModelLoaded: (rootIds) => {
        this._modelType = this._determineModelType(rootIds);
        this._configureUi(this._modelType);
      },
      modelSwitched: (clearOnly) => {
        if (clearOnly) {
          this._modelType = ModelType.Generic;
          this._configureUi(this._modelType);
        }
      },
      sheetActivated: () => {
        this._configureUi(ModelType.Drawing);
      },
      sheetDeactivated: () => {
        this._configureUi(this._modelType);
      },
      modelLoadFailure: (modelName, reason) => {
        if (this._suppressMissingModelDialog) {
          return;
        }
        const errorDialog = new UiDialog("content");
        errorDialog.setTitle("Model Load Error");
        let text = "Unable to load ";
        if (modelName) {
          text += `'${modelName}'`;
        } else {
          text += "model";
        }
        text += `: ${reason}`;
        errorDialog.setText(text);
        errorDialog.show();
      },
      modelLoadBegin: () => {
        this._suppressMissingModelDialog = false;
      },
      missingModel: (modelPath) => {
        if (!this._suppressMissingModelDialog) {
          this._suppressMissingModelDialog = true;
          const errorDialog = new UiDialog("content");
          errorDialog.setTitle("Missing Model Error");
          let text = "Unable to load ";
          text += `'${modelPath}'`;
          errorDialog.setText(text);
          errorDialog.show();
        }
      },
      webGlContextLost: () => {
        const errorDialog = new UiDialog("content");
        errorDialog.setTitle("Fatal Error");
        errorDialog.setText("WebGL context lost. Rendering cannot continue.");
        errorDialog.show();
      },
      XHRonloadend: (_e, status, uri) => {
        if (status === 404) {
          const errorDialog = new UiDialog("content");
          errorDialog.setTitle("404 Error");
          errorDialog.setText(`Unable to load ${uri}`);
          errorDialog.show();
        }
      },
      incrementalSelectionBatchBegin: () => {
        this.freezeModelBrowser(true);
        this.enableModelBrowserPartSelection(false);
      },
      incrementalSelectionBatchEnd: () => {
        this.freezeModelBrowser(false);
        this.enableModelBrowserPartSelection(true);
      },
      incrementalSelectionEnd: () => {
        if (this._modelBrowser !== null) {
          this._modelBrowser.updateSelection(null);
        }
      }
    });
  }
  _getWithDefault(maybeValue, defaultValue) {
    if (maybeValue === void 0) {
      return defaultValue;
    }
    return maybeValue;
  }
  _determineModelType(rootIds) {
    let modelType = ModelType.Generic;
    if (this._viewer.sheetManager.isDrawingSheetActive()) {
      modelType = ModelType.Drawing;
    } else if (this._isBim(rootIds)) {
      modelType = ModelType.Bim;
    }
    return modelType;
  }
  _isBim(rootIds) {
    if (rootIds.length > 0) {
      const id = rootIds[0];
      const fileType = this._viewer.model.getModelFileTypeFromNode(id);
      if (fileType === FileType.Ifc || fileType === FileType.Revit) {
        return true;
      }
    }
    return false;
  }
  _configureUi(modelType) {
    if (this._uiModelType === modelType) {
      return;
    }
    this._uiModelType = modelType;
    const axisTriad = this._viewer.view.getAxisTriad();
    const navCube = this._viewer.view.getNavCube();
    if (modelType === ModelType.Drawing) {
      axisTriad.disable();
      navCube.disable();
      this._viewer.view.setDrawMode(DrawMode.WireframeOnShaded);
    } else {
      axisTriad.enable();
      if (modelType === ModelType.Bim) {
        this._viewer.view.setBackfacesVisible(true);
      } else {
        navCube.enable();
      }
    }
    this._configureToolbar(modelType);
    this._configureModelBrowser(modelType);
  }
  _configureToolbar(modelType) {
    if (this._toolbar === null) {
      return;
    }
    const setElmVisible = (id, visibility) => {
      const elm = document.getElementById(id);
      if (!elm) {
        return;
      }
      elm.style.display = visibility === "hidden" ? "none" : "";
    };
    if (modelType === ModelType.Drawing) {
      [
        "cuttingplane-button",
        "cuttingplane-submenu",
        "explode-button",
        "explode-slider",
        "explode-submenu",
        "view-button",
        "view-submenu",
        "camera-button",
        "camera-submenu",
        "tool_separator_4",
        "tool_separator_1",
        "edgeface-button",
        "edgeface-submenu"
      ].forEach((current) => setElmVisible(current, "hidden"));
    } else {
      [
        "cuttingplane-button",
        "explode-button",
        "view-button",
        "camera-button",
        "tool_separator_4",
        "tool_separator_1",
        "edgeface-button"
      ].forEach((current) => setElmVisible(current, "visible"));
    }
    this._toolbar.reposition();
  }
  _configureModelBrowser(modelType) {
    if (this._modelBrowser === null) {
      return;
    }
    const modelTreeElm = document.getElementsByClassName("ui-modeltree")[0];
    if (!modelTreeElm) {
      return;
    }
    if (modelType === ModelType.Drawing) {
      modelTreeElm.classList.add("drawing");
    } else {
      modelTreeElm.classList.remove("drawing");
    }
  }
  _onSceneReady() {
    const selectionManager = this._viewer.selectionManager;
    selectionManager.setNodeSelectionColor(_DesktopUi._defaultPartSelectionColor);
    selectionManager.setNodeSelectionOutlineColor(_DesktopUi._defaultPartSelectionOutlineColor);
    const view = this._viewer.view;
    view.setXRayColor(ElementType.Faces, _DesktopUi._defaultXRayColor);
    view.setXRayColor(ElementType.Lines, _DesktopUi._defaultXRayColor);
    view.setXRayColor(ElementType.Points, _DesktopUi._defaultXRayColor);
    view.setBackgroundColor(_DesktopUi._defaultBackgroundColor, _DesktopUi._defaultBackgroundColor);
  }
  setDeselectOnIsolate(deselect) {
    this._isolateZoomHelper.setDeselectOnIsolate(deselect);
  }
  /* UI API functions */
  freezeModelBrowser(freeze) {
    if (this._modelBrowser !== null) {
      this._modelBrowser.freeze(freeze);
    }
  }
  enableModelBrowserPartSelection(enable) {
    if (this._modelBrowser !== null) {
      this._modelBrowser.enablePartSelection(enable);
    }
  }
};
let DesktopUi = _DesktopUi;
__publicField(DesktopUi, "_defaultBackgroundColor", Color.white());
__publicField(DesktopUi, "_defaultPartSelectionColor", Color.createFromFloat(0, 0.8, 0));
__publicField(DesktopUi, "_defaultPartSelectionOutlineColor", Color.createFromFloat(0, 0.8, 0));
__publicField(DesktopUi, "_defaultXRayColor", Color.createFromFloat(0, 0.9, 0));
export {
  DesktopUi
};
