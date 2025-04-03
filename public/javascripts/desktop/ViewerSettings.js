var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { PointSizeUnit, WalkDirection, OperatorId, AntiAliasingMode, OrbitFallbackMode, Util, DrawMode, SelectionMask, KeyCode, WalkMode, FloorplanOrientation, Floorplan } from "@hoops/web-viewer";
import { centerWindow, getValueAsString, colorFromRgbString, rgbStringFromColor } from "../common/UiUtil.js";
import { SettingTab } from "./types.js";
class ViewerSettings {
  constructor(viewer) {
    __publicField(this, "_viewer");
    __publicField(this, "_viewerSettingsSelector");
    __publicField(this, "_versionInfo", true);
    __publicField(this, "_axisTriad");
    __publicField(this, "_navCube");
    __publicField(this, "_splatRenderingEnabled", false);
    __publicField(this, "_splatRenderingSize", 3e-3);
    __publicField(this, "_splatRenderingPointSizeUnit", PointSizeUnit.ProportionOfBoundingDiagonal);
    __publicField(this, "_floorplanActive", false);
    __publicField(this, "_honorSceneVisibility", true);
    __publicField(this, "_walkSpeedUnits", 1);
    __publicField(this, "_generalTabLabelId", "#settings-tab-label-general");
    __publicField(this, "_walkTabLabelId", "#settings-tab-label-walk");
    __publicField(this, "_drawingTabLabelId", "#settings-tab-label-drawing");
    __publicField(this, "_floorplanTabLabelId", "#settings-tab-label-floorplan");
    __publicField(this, "_generalTabId", "#settings-tab-general");
    __publicField(this, "_walkTabId", "#settings-tab-walk");
    __publicField(this, "_drawingTabId", "#settings-tab-drawing");
    __publicField(this, "_floorplanTabId", "#settings-tab-floorplan");
    __publicField(this, "_walkKeyIdsMap", /* @__PURE__ */ new Map());
    this._viewer = viewer;
    const view = this._viewer.view;
    this._navCube = view.getNavCube();
    this._axisTriad = view.getAxisTriad();
    this._viewerSettingsSelector = "viewer-settings-dialog";
    this._initElements();
  }
  show() {
    const p = this._updateSettings();
    if (document.body.classList.contains("mobile")) {
      this._scaleForMobile();
    }
    centerWindow(this._viewerSettingsSelector, this._viewer.view.getCanvasSize());
    $(`#${this._viewerSettingsSelector}`).show();
    return p;
  }
  hide() {
    $(`#${this._viewerSettingsSelector}`).hide();
  }
  _scaleForMobile() {
    const $settingsWindow = $(`#${this._viewerSettingsSelector}`);
    const $settingsWindowBodies = $(`#${this._viewerSettingsSelector} .hoops-ui-window-body`);
    const canvasSize = this._viewer.view.getCanvasSize();
    const transformScale = 1.8;
    const windowWidth = $settingsWindow.width();
    if (windowWidth !== void 0 && windowWidth * transformScale > canvasSize.x) {
      $settingsWindowBodies.css("width", canvasSize.x / 1.8);
    }
    const windowHeight = $settingsWindow.height();
    if (windowHeight !== void 0 && windowHeight * transformScale > canvasSize.y) {
      $settingsWindow.show();
      const headerHeight = $(`#${this._viewerSettingsSelector} .hoops-ui-window-header`).get(
        0
      ).offsetHeight;
      const footerHeight = $(`#${this._viewerSettingsSelector} .hoops-ui-window-footer`).get(
        0
      ).offsetHeight;
      $settingsWindow.hide();
      const otherThingsHeight = (headerHeight + footerHeight) * 1.4;
      $settingsWindowBodies.css("height", canvasSize.y / transformScale - otherThingsHeight);
    }
  }
  _initElements() {
    this._walkKeyIdsMap.set(WalkDirection.Up, "walk-key-up");
    this._walkKeyIdsMap.set(WalkDirection.Down, "walk-key-down");
    this._walkKeyIdsMap.set(WalkDirection.Left, "walk-key-left");
    this._walkKeyIdsMap.set(WalkDirection.Right, "walk-key-right");
    this._walkKeyIdsMap.set(WalkDirection.Forward, "walk-key-forward");
    this._walkKeyIdsMap.set(WalkDirection.Backward, "walk-key-backward");
    this._walkKeyIdsMap.set(WalkDirection.TiltUp, "walk-key-tilt-up");
    this._walkKeyIdsMap.set(WalkDirection.TiltDown, "walk-key-tilt-down");
    this._walkKeyIdsMap.set(WalkDirection.RotateLeft, "walk-key-rotate-left");
    this._walkKeyIdsMap.set(WalkDirection.RotateRight, "walk-key-rotate-right");
    $("#viewer-settings-dialog").draggable({
      handle: ".hoops-ui-window-header"
    });
    $("INPUT.color-picker").each(function() {
      $(this).minicolors({
        position: $(this).attr("data-position") || "bottom left",
        format: "rgb",
        control: "hue"
      });
    });
    $("#viewer-settings-ok-button").on("click", () => {
      (async () => {
        await this._applySettings();
        this.hide();
      })();
    });
    $("#viewer-settings-cancel-button").on("click", () => {
      this.hide();
    });
    $("#viewer-settings-apply-button").on("click", () => {
      (async () => {
        await this._applySettings();
      })();
    });
    $("#settings-pmi-enabled").on("click", () => {
      this._updateEnabledStyle(
        "settings-pmi-enabled",
        ["settings-pmi-color-style"],
        ["settings-pmi-color"],
        $("#settings-pmi-enabled").prop("checked")
      );
    });
    $("#settings-splat-rendering-enabled").on("click", () => {
      this._updateEnabledStyle(
        "settings-splat-rendering-enabled",
        ["settings-splat-enabled-style"],
        ["settings-splat-rendering-size", "settings-splat-rendering-point-size-unit"],
        $("#settings-splat-rendering-enabled").prop("checked")
      );
    });
    $("#settings-mouse-look-enabled").on("click", () => {
      this._updateEnabledStyle(
        "settings-mouse-look-enabled",
        ["settings-mouse-look-style"],
        ["settings-mouse-look-speed"],
        $("#settings-mouse-look-enabled").prop("checked")
      );
    });
    $("#settings-bim-mode-enabled").on("click", () => {
      this._updateEnabledStyle(
        "settings-bim-mode-enabled",
        [],
        [],
        $("#settings-bim-mode-enabled").prop("checked")
      );
    });
    $("#settings-bloom-enabled").on("click", () => {
      this._updateEnabledStyle(
        "settings-bloom-enabled",
        ["settings-bloom-style"],
        ["settings-bloom-intensity", "settings-bloom-threshold"],
        $("#settings-bloom-enabled").prop("checked")
      );
    });
    $("#settings-shadow-enabled").on("click", () => {
      this._updateEnabledStyle(
        "settings-shadow-enabled",
        ["settings-shadow-style"],
        ["settings-shadow-blur-samples", "settings-shadow-interactive"],
        $("#settings-shadow-enabled").prop("checked")
      );
    });
    const settingsSilhouetteEnabled = "settings-silhouette-enabled";
    $(`#${settingsSilhouetteEnabled}`).on("click", () => {
      this._updateEnabledStyle(
        `${settingsSilhouetteEnabled}`,
        [],
        [],
        $(`#${settingsSilhouetteEnabled}`).prop("checked")
      );
    });
    this._viewer.setCallbacks({
      firstModelLoaded: () => {
        (async () => {
          const operatorManager = this._viewer.operatorManager;
          const keyboardWalkOperator = operatorManager.getOperator(OperatorId.KeyboardWalk);
          const walkSpeed = keyboardWalkOperator.getWalkSpeed();
          if (walkSpeed <= 0) {
            await keyboardWalkOperator.resetDefaultWalkSpeeds();
            this._updateWalkSettingsHelper();
          }
        })();
      },
      modelSwitchStart: () => {
        this._honorSceneVisibility = true;
      }
    });
    $("#settings-walk-mode").on("change", () => {
      const walkMode = parseInt(getValueAsString("#settings-walk-mode"), 10);
      this._updateKeyboardWalkModeStyle(walkMode);
    });
    $(this._generalTabLabelId).on("click", () => {
      this._switchTab(SettingTab.General);
    });
    $(this._walkTabLabelId).on("click", () => {
      this._switchTab(SettingTab.Walk);
    });
    $(this._drawingTabLabelId).on("click", () => {
      this._switchTab(SettingTab.Drawing);
    });
    $(this._floorplanTabLabelId).on("click", () => {
      this._switchTab(SettingTab.Floorplan);
    });
  }
  /** @hidden */
  _switchTab(tab) {
    const generalTabLabel = $(this._generalTabLabelId);
    const walkTabLabel = $(this._walkTabLabelId);
    const drawingTabLabel = $(this._drawingTabLabelId);
    const floorplanTabLabel = $(this._floorplanTabLabelId);
    const generalTab = $(this._generalTabId);
    const walkTab = $(this._walkTabId);
    const drawingTab = $(this._drawingTabId);
    const floorplanTab = $(this._floorplanTabId);
    generalTabLabel.removeClass("selected");
    generalTab.removeClass("selected");
    walkTab.removeClass("selected");
    walkTabLabel.removeClass("selected");
    drawingTab.removeClass("selected");
    drawingTabLabel.removeClass("selected");
    floorplanTab.removeClass("selected");
    floorplanTabLabel.removeClass("selected");
    switch (tab) {
      case SettingTab.General:
        generalTabLabel.addClass("selected");
        generalTab.addClass("selected");
        break;
      case SettingTab.Walk:
        walkTab.addClass("selected");
        walkTabLabel.addClass("selected");
        break;
      case SettingTab.Drawing:
        drawingTab.addClass("selected");
        drawingTabLabel.addClass("selected");
        break;
      case SettingTab.Floorplan:
        floorplanTab.addClass("selected");
        floorplanTabLabel.addClass("selected");
        break;
    }
  }
  // takes current settings and updates the settings window.
  _updateSettings() {
    const view = this._viewer.view;
    const model = this._viewer.model;
    const selectionManager = this._viewer.selectionManager;
    const cuttingManager = this._viewer.cuttingManager;
    const measureManager = this._viewer.measureManager;
    const operatorManager = this._viewer.operatorManager;
    if (this._versionInfo) {
      $("#settings-format-version").html(this._viewer.getFormatVersionString());
      $("#settings-viewer-version").html(this._viewer.getViewerVersionString());
      this._versionInfo = false;
    }
    const backgroundColor = view.getBackgroundColor();
    let backgroundColorTop;
    if (backgroundColor.top === null) {
      backgroundColorTop = colorFromRgbString("rgb(192,220,248)");
    } else {
      backgroundColorTop = backgroundColor.top;
    }
    let backgroundColorBottom;
    if (backgroundColor.bottom === null) {
      backgroundColorBottom = colorFromRgbString("rgb(192,220,248)");
    } else {
      backgroundColorBottom = backgroundColor.bottom;
    }
    const selectionColorBody = selectionManager.getNodeSelectionColor();
    const selectionColorFaceLine = selectionManager.getNodeElementSelectionColor();
    const measurementColor = measureManager.getMeasurementColor();
    const projectionMode = view.getProjectionMode();
    const showBackfaces = view.getBackfacesVisible();
    const hiddenLineOpacity = view.getHiddenLineSettings().getObscuredLineOpacity();
    const showCappingGeometry = cuttingManager.getCappingGeometryVisibility();
    const enableFaceLineSelection = selectionManager.getHighlightFaceElementSelection() && selectionManager.getHighlightLineElementSelection();
    const cappingGeometryFaceColor = cuttingManager.getCappingFaceColor();
    const cappingGeometryLineColor = cuttingManager.getCappingLineColor();
    const ambientOcclusionEnabled = view.getAmbientOcclusionEnabled();
    const ambientOcclusionRadius = view.getAmbientOcclusionRadius();
    const antiAliasingEnabled = view.getAntiAliasingMode() === AntiAliasingMode.SMAA;
    const bloomEnabled = view.getBloomEnabled();
    const bloomIntensity = view.getBloomIntensityScale();
    const bloomThreshold = view.getBloomThreshold();
    const silhouetteEnabled = view.getSilhouetteEnabled();
    const reflectionEnabled = view.getSimpleReflectionEnabled();
    const shadowEnabled = view.getSimpleShadowEnabled();
    const shadowInteractive = view.getSimpleShadowInteractiveUpdateEnabled();
    const blurSamples = view.getSimpleShadowBlurSamples();
    const pmiColor = model.getPmiColor();
    const pmiEnabled = model.getPmiColorOverride();
    const orbitOperator = operatorManager.getOperator(OperatorId.Orbit);
    const orbitCameraTarget = orbitOperator.getOrbitFallbackMode() === OrbitFallbackMode.CameraTarget;
    const axisTriadEnabled = this._axisTriad.getEnabled();
    const navCubeEnabled = this._navCube.getEnabled();
    const ps = [];
    ps.push(this._updateWalkSettings());
    this._updateDrawingSettings();
    this._updateFloorplanSettings();
    $("#settings-selection-color-body").minicolors("value", rgbStringFromColor(selectionColorBody));
    $("#settings-selection-color-face-line").minicolors(
      "value",
      rgbStringFromColor(selectionColorFaceLine)
    );
    $("#settings-background-top").minicolors("value", rgbStringFromColor(backgroundColorTop));
    $("#settings-background-bottom").minicolors("value", rgbStringFromColor(backgroundColorBottom));
    $("#settings-measurement-color").minicolors("value", rgbStringFromColor(measurementColor));
    $("#settings-capping-face-color").minicolors(
      "value",
      rgbStringFromColor(cappingGeometryFaceColor)
    );
    $("#settings-capping-line-color").minicolors(
      "value",
      rgbStringFromColor(cappingGeometryLineColor)
    );
    $("#settings-projection-mode").val(`${projectionMode}`);
    $("#settings-show-backfaces").prop("checked", showBackfaces);
    $("#settings-show-capping-geometry").prop("checked", showCappingGeometry);
    $("#settings-enable-face-line-selection").prop("checked", enableFaceLineSelection);
    $("#settings-orbit-mode").prop("checked", orbitCameraTarget);
    $("#settings-select-scene-invisible").prop("checked", this._honorSceneVisibility);
    $("#settings-ambient-occlusion").prop("checked", ambientOcclusionEnabled);
    $("#settings-ambient-occlusion-radius").val(`${ambientOcclusionRadius}`);
    $("#settings-anti-aliasing").prop("checked", antiAliasingEnabled);
    $("#settings-bloom-intensity").val(`${bloomIntensity}`);
    $("#settings-bloom-threshold").val(`${bloomThreshold}`);
    $("#settings-axis-triad").prop("checked", axisTriadEnabled);
    $("#settings-nav-cube").prop("checked", navCubeEnabled);
    $("#settings-silhouette-enabled").prop("checked", silhouetteEnabled);
    $("#settings-reflection-enabled").prop("checked", reflectionEnabled);
    $("#settings-shadow-interactive").prop("checked", shadowInteractive);
    $("#settings-shadow-blur-samples").val(blurSamples);
    $("#settings-pmi-color").minicolors("value", rgbStringFromColor(pmiColor));
    if (pmiEnabled !== $("#settings-pmi-enabled").prop("checked")) {
      $("#settings-pmi-enabled").trigger("click");
    }
    ps.push(
      this._viewer.getMinimumFramerate().then((minFramerate) => {
        $("#settings-framerate").val(`${minFramerate}`);
      })
    );
    if (hiddenLineOpacity !== void 0) {
      $("#settings-hidden-line-opacity").val(`${hiddenLineOpacity}`);
    } else {
      $("#settings-hidden-line-opacity").val("");
    }
    if (bloomEnabled !== $("#settings-bloom-enabled").prop("checked")) {
      $("#settings-bloom-enabled").trigger("click");
    }
    if (shadowEnabled !== $("#settings-shadow-enabled").prop("checked")) {
      $("#settings-shadow-enabled").trigger("click");
    }
    ps.push(
      view.getPointSize().then((value) => {
        const splatRenderingSize = value[0];
        const splatRenderingPointSizeUnit = value[1];
        this._splatRenderingEnabled = splatRenderingSize !== 1 || splatRenderingPointSizeUnit !== PointSizeUnit.ScreenPixels;
        if (this._splatRenderingEnabled !== $("#settings-splat-rendering-enabled").prop("checked")) {
          $("#settings-splat-rendering-enabled").trigger("click");
        }
        if (this._splatRenderingEnabled) {
          this._splatRenderingSize = splatRenderingSize;
          this._splatRenderingPointSizeUnit = splatRenderingPointSizeUnit;
        }
        const splatSize = $("#settings-splat-rendering-size");
        if (Number(splatSize.prop("step")) > this._splatRenderingSize) {
          splatSize.prop("step", `${this._splatRenderingSize / 3}`);
        }
        splatSize.val(`${this._splatRenderingSize}`);
        $("#settings-splat-rendering-point-size-unit").val(`${this._splatRenderingPointSizeUnit}`);
      })
    );
    ps.push(
      view.getEyeDomeLightingEnabled().then((enabled) => {
        $("#settings-eye-dome-lighting-enabled").prop("checked", enabled);
      })
    );
    return Util.waitForAll(ps);
  }
  _applySettings() {
    const ps = [];
    const view = this._viewer.view;
    const model = this._viewer.model;
    const cuttingManager = this._viewer.cuttingManager;
    const selectionManager = this._viewer.selectionManager;
    ps.push(this._applyWalkSettings());
    const backgroundTop = colorFromRgbString(getValueAsString("#settings-background-top"));
    const backgroundBottom = colorFromRgbString(getValueAsString("#settings-background-bottom"));
    this._viewer.view.setBackgroundColor(backgroundTop, backgroundBottom);
    const selectionColorBody = colorFromRgbString(
      getValueAsString("#settings-selection-color-body")
    );
    selectionManager.setNodeSelectionColor(selectionColorBody);
    selectionManager.setNodeSelectionOutlineColor(selectionColorBody);
    const selectionColorFaceLine = colorFromRgbString(
      getValueAsString("#settings-selection-color-face-line")
    );
    selectionManager.setNodeElementSelectionColor(selectionColorFaceLine);
    selectionManager.setNodeElementSelectionOutlineColor(selectionColorFaceLine);
    const enableFaceLineSelection = $("#settings-enable-face-line-selection").prop("checked");
    selectionManager.setHighlightFaceElementSelection(enableFaceLineSelection);
    selectionManager.setHighlightLineElementSelection(enableFaceLineSelection);
    this._viewer.measureManager.setMeasurementColor(
      colorFromRgbString(getValueAsString("#settings-measurement-color"))
    );
    const pmiColor = colorFromRgbString(getValueAsString("#settings-pmi-color"));
    const pmiEnabled = $("#settings-pmi-enabled").prop("checked");
    if (pmiColor && pmiEnabled) {
      model.setPmiColor(pmiColor);
      model.setPmiColorOverride(true);
    } else {
      model.setPmiColorOverride(false);
    }
    ps.push(
      cuttingManager.setCappingFaceColor(
        colorFromRgbString(getValueAsString("#settings-capping-face-color"))
      )
    );
    ps.push(
      cuttingManager.setCappingLineColor(
        colorFromRgbString(getValueAsString("#settings-capping-line-color"))
      )
    );
    view.setProjectionMode(parseInt(getValueAsString("#settings-projection-mode"), 10));
    const showBackfaces = $("#settings-show-backfaces").prop("checked");
    view.setBackfacesVisible(showBackfaces);
    const showCappingGeometry = $("#settings-show-capping-geometry").prop("checked");
    ps.push(cuttingManager.setCappingGeometryVisibility(showCappingGeometry));
    const minFramerate = parseInt(getValueAsString("#settings-framerate"), 10);
    if (minFramerate && minFramerate > 0) {
      this._viewer.setMinimumFramerate(minFramerate);
    }
    const hiddenLineOpacity = parseFloat(getValueAsString("#settings-hidden-line-opacity"));
    view.getHiddenLineSettings().setObscuredLineOpacity(hiddenLineOpacity);
    if (view.getDrawMode() === DrawMode.HiddenLine) {
      view.setDrawMode(DrawMode.HiddenLine);
    }
    const orbitOperator = this._viewer.operatorManager.getOperator(OperatorId.Orbit);
    const orbitCameraTarget = $("#settings-orbit-mode").prop("checked");
    orbitOperator.setOrbitFallbackMode(
      orbitCameraTarget ? OrbitFallbackMode.CameraTarget : OrbitFallbackMode.ModelCenter
    );
    this._honorSceneVisibility = $("#settings-select-scene-invisible").prop("checked");
    const forceEffectiveSceneVisibilityMask = this._honorSceneVisibility ? SelectionMask.None : SelectionMask.All;
    const selectionOperator = this._viewer.operatorManager.getOperator(OperatorId.Select);
    const selectionOperatorPickConfig = selectionOperator.getPickConfig();
    selectionOperatorPickConfig.forceEffectiveSceneVisibilityMask = forceEffectiveSceneVisibilityMask;
    selectionOperator.setPickConfig(selectionOperatorPickConfig);
    const areaSelectionOperator = this._viewer.operatorManager.getOperator(OperatorId.AreaSelect);
    areaSelectionOperator.setForceEffectiveSceneVisibilityMask(forceEffectiveSceneVisibilityMask);
    const rayDrillSelectionOperator = this._viewer.operatorManager.getOperator(
      OperatorId.RayDrillSelect
    );
    rayDrillSelectionOperator.setForceEffectiveSceneVisibilityMask(
      forceEffectiveSceneVisibilityMask
    );
    view.setAmbientOcclusionEnabled($("#settings-ambient-occlusion").prop("checked"));
    view.setAmbientOcclusionRadius(
      parseFloat(getValueAsString("#settings-ambient-occlusion-radius"))
    );
    if ($("#settings-anti-aliasing").prop("checked"))
      view.setAntiAliasingMode(AntiAliasingMode.SMAA);
    else
      view.setAntiAliasingMode(AntiAliasingMode.None);
    view.setBloomEnabled($("#settings-bloom-enabled").prop("checked"));
    view.setBloomIntensityScale(parseFloat(getValueAsString("#settings-bloom-intensity")));
    view.setBloomThreshold(parseFloat(getValueAsString("#settings-bloom-threshold")));
    view.setSilhouetteEnabled($("#settings-silhouette-enabled").prop("checked"));
    view.setSimpleReflectionEnabled($("#settings-reflection-enabled").prop("checked"));
    view.setSimpleShadowEnabled($("#settings-shadow-enabled").prop("checked"));
    view.setSimpleShadowInteractiveUpdateEnabled($("#settings-shadow-interactive").prop("checked"));
    view.setSimpleShadowBlurSamples(
      parseInt(getValueAsString("#settings-shadow-blur-samples"), 10)
    );
    if ($("#settings-axis-triad").prop("checked"))
      this._axisTriad.enable();
    else
      this._axisTriad.disable();
    if ($("#settings-nav-cube").prop("checked"))
      this._navCube.enable();
    else
      this._navCube.disable();
    if ($("#settings-splat-rendering-enabled").prop("checked")) {
      this._splatRenderingEnabled = true;
      this._splatRenderingSize = parseFloat(getValueAsString("#settings-splat-rendering-size"));
      this._splatRenderingPointSizeUnit = parseInt(
        getValueAsString("#settings-splat-rendering-point-size-unit"),
        10
      );
      view.setPointSize(this._splatRenderingSize, this._splatRenderingPointSizeUnit);
    } else {
      this._splatRenderingEnabled = false;
      view.setPointSize(1, PointSizeUnit.ScreenPixels);
    }
    view.setEyeDomeLightingEnabled($("#settings-eye-dome-lighting-enabled").prop("checked"));
    ps.push(this._applyDrawingSettings());
    ps.push(this._applyFloorplanSettings());
    return Util.waitForAll(ps);
  }
  _applyWalkKeyText(walkDirection, keyCode) {
    if (keyCode < KeyCode.a || keyCode > KeyCode.z) {
      return;
    }
    const id = this._walkKeyIdsMap.get(walkDirection);
    const key = KeyCode[keyCode].toUpperCase();
    $(`#${id}`).html(key);
  }
  async _applyWalkSettings() {
    const operatorManager = this._viewer.operatorManager;
    const keyboardWalkOperator = operatorManager.getOperator(OperatorId.KeyboardWalk);
    const walkModeOperator = operatorManager.getOperator(OperatorId.WalkMode);
    const walkMode = parseInt(getValueAsString("#settings-walk-mode"), 10);
    await walkModeOperator.setWalkMode(walkMode);
    const rotationSpeed = parseInt(getValueAsString("#settings-walk-rotation"), 10);
    const walkSpeed = parseFloat(getValueAsString("#settings-walk-speed")) * this._walkSpeedUnits;
    const elevationSpeed = parseFloat(getValueAsString("#settings-walk-elevation")) * this._walkSpeedUnits;
    const viewAngle = parseInt(getValueAsString("#settings-walk-view-angle"), 10);
    const mouseLookEnabled = $("#settings-mouse-look-enabled").prop("checked");
    const mouseLookSpeed = parseInt(getValueAsString("#settings-mouse-look-speed"), 10);
    const bimModeEnabled = $("#settings-bim-mode-enabled").prop("checked");
    $("#walk-navigation-keys .walk-key").html("");
    const walkKeyMapping = keyboardWalkOperator.getKeyMapping();
    walkKeyMapping.forEach((walkDirection, keyCode) => {
      this._applyWalkKeyText(walkDirection, keyCode);
    });
    if (walkSpeed === 0) {
      await walkModeOperator.resetDefaultWalkSpeeds();
      this._updateWalkSettingsHelper();
    } else {
      walkModeOperator.setRotationSpeed(rotationSpeed);
      walkModeOperator.setWalkSpeed(walkSpeed);
      walkModeOperator.setElevationSpeed(elevationSpeed);
      walkModeOperator.setViewAngle(viewAngle);
      if (walkMode === WalkMode.Keyboard) {
        keyboardWalkOperator.setMouseLookEnabled(mouseLookEnabled);
        keyboardWalkOperator.setMouseLookSpeed(mouseLookSpeed);
      }
    }
    if (bimModeEnabled) {
      await this._viewer.model.registerIfcNodes(this._viewer.model.getAbsoluteRootNode());
      await walkModeOperator.setBimModeEnabled(true);
    } else {
      await walkModeOperator.setBimModeEnabled(false);
    }
  }
  _updateKeyboardWalkModeStyle(walkMode) {
    const styleIds = [
      "walk-mouse-look-text",
      "settings-mouse-look-style",
      "walk-navigation-keys"
    ];
    const propertyIds = ["settings-mouse-look-enabled", "settings-mouse-look-speed"];
    this._updateEnabledStyle(null, styleIds, propertyIds, walkMode === WalkMode.Keyboard);
  }
  _updateWalkSpeedUnits(walkSpeed) {
    const logWalkSpeed = Math.log(walkSpeed) / Math.LN10;
    this._walkSpeedUnits = Math.pow(10, Math.floor(logWalkSpeed));
    let units = "m";
    if (this._walkSpeedUnits <= 1e-3) {
      units = "&micro;m";
    } else if (this._walkSpeedUnits <= 1) {
      units = "mm";
    } else if (this._walkSpeedUnits <= 10) {
      units = "cm";
    } else {
      this._walkSpeedUnits = 1e3;
    }
    $("#walk-speed-units").html(units);
    $("#elevation-speed-units").html(units);
  }
  _updateWalkSettingsHelper() {
    const operatorManager = this._viewer.operatorManager;
    const keyboardWalkOperator = operatorManager.getOperator(OperatorId.KeyboardWalk);
    const walkModeOperator = operatorManager.getOperator(OperatorId.WalkMode);
    const rotationSpeed = keyboardWalkOperator.getRotationSpeed();
    const walkSpeed = keyboardWalkOperator.getWalkSpeed();
    const elevationSpeed = keyboardWalkOperator.getElevationSpeed();
    const viewAngle = keyboardWalkOperator.getViewAngle();
    const mouseLookEnabled = keyboardWalkOperator.getMouseLookEnabled();
    const mouseLookSpeed = keyboardWalkOperator.getMouseLookSpeed();
    const bimModeEnabled = keyboardWalkOperator.isBimModeEnabled();
    const walkMode = walkModeOperator.getWalkMode();
    this._updateWalkSpeedUnits(walkSpeed);
    $("#settings-walk-mode").val(`${walkMode}`);
    $("#settings-walk-rotation").val(`${rotationSpeed}`);
    $("#settings-walk-speed").val((walkSpeed / this._walkSpeedUnits).toFixed(1));
    $("#settings-walk-elevation").val((elevationSpeed / this._walkSpeedUnits).toFixed(1));
    $("#settings-walk-view-angle").val(`${viewAngle}`);
    $("#settings-mouse-look-speed").val(`${mouseLookSpeed}`);
    this._updateEnabledStyle(
      "settings-mouse-look-enabled",
      ["settings-mouse-look-style"],
      ["settings-mouse-look-speed"],
      mouseLookEnabled
    );
    this._updateEnabledStyle("settings-bim-mode-enabled", [], [], bimModeEnabled);
    this._updateKeyboardWalkModeStyle(walkMode);
  }
  async _updateWalkSettings() {
    const operatorManager = this._viewer.operatorManager;
    const keyboardWalkOperator = operatorManager.getOperator(OperatorId.KeyboardWalk);
    const walkSpeed = keyboardWalkOperator.getWalkSpeed();
    if (walkSpeed === 0) {
      await keyboardWalkOperator.resetDefaultWalkSpeeds();
    }
    this._updateWalkSettingsHelper();
  }
  _updateDrawingSettings() {
    const sheetBackgroundColor = this._viewer.sheetManager.getSheetBackgroundColor();
    const sheetColor = this._viewer.sheetManager.getSheetColor();
    const sheetShadowColor = this._viewer.sheetManager.getSheetShadowColor();
    const sheetBackgroundEnabled = this._viewer.sheetManager.getBackgroundSheetEnabled();
    $("#settings-drawing-background").minicolors("value", rgbStringFromColor(sheetBackgroundColor));
    $("#settings-drawing-sheet").minicolors("value", rgbStringFromColor(sheetColor));
    $("#settings-drawing-sheet-shadow").minicolors("value", rgbStringFromColor(sheetShadowColor));
    $("#settings-drawing-background-enabled").prop("checked", sheetBackgroundEnabled);
  }
  async _applyDrawingSettings() {
    const sheetBackgroundColor = colorFromRgbString(
      getValueAsString("#settings-drawing-background")
    );
    const sheetColor = colorFromRgbString(getValueAsString("#settings-drawing-sheet"));
    const sheetShadowColor = colorFromRgbString(getValueAsString("#settings-drawing-sheet-shadow"));
    const backgroundSheetEnabled = $("#settings-drawing-background-enabled").prop(
      "checked"
    );
    await this._viewer.sheetManager.setBackgroundSheetEnabled(backgroundSheetEnabled);
    await this._viewer.sheetManager.setSheetColors(
      sheetBackgroundColor,
      sheetColor,
      sheetShadowColor
    );
  }
  _updateFloorplanSettings() {
    const floorplan = this._viewer.floorplanManager;
    const floorplanConfig = floorplan.getConfiguration();
    const floorplanActive = floorplan.isActive();
    this._floorplanActive = floorplanActive;
    $("#settings-floorplan-active").prop("checked", floorplanActive);
    $("#settings-floorplan-track-camera").prop("checked", floorplanConfig.trackCameraEnabled);
    switch (floorplanConfig.floorplanOrientation) {
      case FloorplanOrientation.NorthUp:
        $("#settings-floorplan-orientation").val("0");
        break;
      case FloorplanOrientation.AvatarUp:
        $("#settings-floorplan-orientation").val("1");
        break;
    }
    switch (floorplanConfig.autoActivate) {
      case Floorplan.FloorplanAutoActivation.Bim:
        $("#settings-floorplan-auto-activate").val("0");
        break;
      case Floorplan.FloorplanAutoActivation.BimWalk:
        $("#settings-floorplan-auto-activate").val("1");
        break;
      case Floorplan.FloorplanAutoActivation.Never:
        $("#settings-floorplan-auto-activate").val("2");
        break;
    }
    $("#settings-floorplan-feet-per-pixel").val(`${floorplanConfig.overlayFeetPerPixel}`);
    $("#settings-floorplan-zoom").val(`${floorplanConfig.zoomLevel}`);
    $("#settings-floorplan-background-opacity").val(`${floorplanConfig.backgroundOpacity}`);
    $("#settings-floorplan-border-opacity").val(`${floorplanConfig.borderOpacity}`);
    $("#settings-floorplan-avatar-opacity").val(`${floorplanConfig.avatarOpacity}`);
    $("#settings-floorplan-background-color").minicolors(
      "value",
      rgbStringFromColor(floorplanConfig.backgroundColor)
    );
    $("#settings-floorplan-border-color").minicolors(
      "value",
      rgbStringFromColor(floorplanConfig.borderColor)
    );
    $("#settings-floorplan-avatar-color").minicolors(
      "value",
      rgbStringFromColor(floorplanConfig.avatarColor)
    );
    $("#settings-floorplan-avatar-outline-color").minicolors(
      "value",
      rgbStringFromColor(floorplanConfig.avatarOutlineColor)
    );
    this._updateEnabledStyle(
      null,
      ["settings-floorplan-zoom-style"],
      ["settings-floorplan-zoom"],
      floorplanConfig.trackCameraEnabled
    );
    this._updateEnabledStyle(
      null,
      ["settings-floorplan-feet-per-pixel-style"],
      ["settings-floorplan-feet-per-pixel"],
      floorplanConfig.trackCameraEnabled
    );
  }
  async _applyFloorplanSettings() {
    const activate = $("#settings-floorplan-active").prop("checked");
    const trackCamera = $("#settings-floorplan-track-camera").prop("checked");
    let orientation;
    switch ($("#settings-floorplan-orientation").val()) {
      case "0":
        orientation = FloorplanOrientation.NorthUp;
        break;
      case "1":
        orientation = FloorplanOrientation.AvatarUp;
        break;
      default:
        orientation = FloorplanOrientation.NorthUp;
    }
    let autoActivate;
    switch ($("#settings-floorplan-auto-activate").val()) {
      case "0":
        autoActivate = Floorplan.FloorplanAutoActivation.Bim;
        break;
      case "1":
        autoActivate = Floorplan.FloorplanAutoActivation.BimWalk;
        break;
      case "2":
        autoActivate = Floorplan.FloorplanAutoActivation.Never;
        break;
      default:
        autoActivate = Floorplan.FloorplanAutoActivation.BimWalk;
    }
    const feetPerPixel = parseFloat(getValueAsString("#settings-floorplan-feet-per-pixel"));
    const overlayZoom = parseFloat(getValueAsString("#settings-floorplan-zoom"));
    const backgroundOpacity = parseFloat(
      getValueAsString("#settings-floorplan-background-opacity")
    );
    const borderOpacity = parseFloat(getValueAsString("#settings-floorplan-border-opacity"));
    const avatarOpacity = parseFloat(getValueAsString("#settings-floorplan-avatar-opacity"));
    const backgroundColor = colorFromRgbString(
      getValueAsString("#settings-floorplan-background-color")
    );
    const borderColor = colorFromRgbString(getValueAsString("#settings-floorplan-border-color"));
    const avatarColor = colorFromRgbString(getValueAsString("#settings-floorplan-avatar-color"));
    const avatarOutlineColor = colorFromRgbString(
      getValueAsString("#settings-floorplan-avatar-outline-color")
    );
    const floorplanConfig = this._viewer.floorplanManager.getConfiguration();
    floorplanConfig.trackCameraEnabled = trackCamera;
    floorplanConfig.floorplanOrientation = orientation;
    floorplanConfig.autoActivate = autoActivate;
    floorplanConfig.overlayFeetPerPixel = feetPerPixel;
    floorplanConfig.zoomLevel = overlayZoom;
    floorplanConfig.backgroundOpacity = backgroundOpacity;
    floorplanConfig.borderOpacity = borderOpacity;
    floorplanConfig.avatarOpacity = avatarOpacity;
    floorplanConfig.backgroundColor = backgroundColor;
    floorplanConfig.borderColor = borderColor;
    floorplanConfig.avatarColor = avatarColor;
    floorplanConfig.avatarOutlineColor = avatarOutlineColor;
    this._updateEnabledStyle(
      null,
      ["settings-floorplan-zoom-style"],
      ["settings-floorplan-zoom"],
      trackCamera
    );
    this._updateEnabledStyle(
      null,
      ["settings-floorplan-feet-per-pixel-style"],
      ["settings-floorplan-feet-per-pixel"],
      trackCamera
    );
    await this._viewer.floorplanManager.setConfiguration(floorplanConfig);
    if (activate && !this._floorplanActive) {
      this._floorplanActive = true;
      await this._viewer.floorplanManager.activate();
    } else if (!activate && this._floorplanActive) {
      this._floorplanActive = false;
      await this._viewer.floorplanManager.deactivate();
    }
    const floorplanActive = this._viewer.floorplanManager.isActive();
    $("#settings-floorplan-active").prop("checked", floorplanActive);
  }
  _updateEnabledStyle(checkboxId, styleIds, propertyIds, enabled) {
    if (checkboxId !== null) {
      $(`#${checkboxId}`).prop("checked", enabled);
    }
    if (enabled) {
      for (const styleId of styleIds) {
        $(`#${styleId}`).removeClass("grayed-out");
      }
    } else {
      for (const styleId of styleIds) {
        $(`#${styleId}`).addClass("grayed-out");
      }
    }
    for (const propertyId of propertyIds) {
      $(`#${propertyId}`).prop("disabled", !enabled);
    }
  }
}
export {
  ViewerSettings
};
