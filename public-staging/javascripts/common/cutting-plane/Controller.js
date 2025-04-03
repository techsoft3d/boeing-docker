var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { Matrix, Plane } from "@hoops/web-viewer";
import { Status, CuttingSectionIndex } from "./types.js";
import { BoundingManager } from "./BoundingManager.js";
import { CuttingSectionManager } from "./CuttingSectionManager.js";
import { FaceSelectionManager } from "./FaceSelectionManager.js";
import { PlaneInfoManager } from "./PlaneInfoManager.js";
import { StateMachine } from "./StateMachine.js";
class Controller {
  constructor(viewer) {
    __publicField(this, "_viewer");
    __publicField(this, "_stateMachine");
    __publicField(this, "_planeInfoMgr", new PlaneInfoManager());
    __publicField(this, "_cuttingSectionsMgr", new CuttingSectionManager());
    __publicField(this, "_modelBoundingMgr", new BoundingManager());
    __publicField(this, "_faceSelectionMgr", new FaceSelectionManager());
    __publicField(this, "_showReferenceGeometry", true);
    __publicField(this, "_pendingFuncs", {});
    this._viewer = viewer;
    this._stateMachine = new StateMachine(this);
    this._viewer.setCallbacks({
      assemblyTreeReady: () => this._stateMachine.handle("init"),
      visibilityChanged: () => this._stateMachine.handle("update"),
      hwfParseComplete: () => this._stateMachine.handle("update"),
      firstModelLoaded: () => this._stateMachine.handle("refresh"),
      modelSwitched: () => this._stateMachine.handle("refresh"),
      modelSwitchStart: () => this._stateMachine.handle("clear")
    });
  }
  async init() {
    await this._initSection();
    await this._updateBoundingBox();
  }
  async update() {
    await this._updateBoundingBox();
  }
  async pause() {
    this._stateMachine.handle("pause");
  }
  async resume() {
    this._stateMachine.handle("resume");
  }
  async refresh() {
    await this._updateBoundingBox();
    await this.resetCuttingPlanes();
  }
  async clear() {
    await this._cuttingSectionsMgr.clearAll();
  }
  get individualCuttingSectionEnabled() {
    return this._cuttingSectionsMgr.useIndividualCuttingSections;
  }
  getPlaneStatus(sectionIndex) {
    return this._planeInfoMgr.get(sectionIndex).status;
  }
  async onSectionsChanged() {
    const planes = this._cuttingSectionsMgr.planes;
    const referenceGeometry = this._cuttingSectionsMgr.referenceGeometry;
    const activePlane = planes.filter((plane) => plane === null).length === 0;
    const noActiveGeometry = referenceGeometry.filter((geometry) => geometry !== null).length === 0;
    this._showReferenceGeometry = !activePlane || !noActiveGeometry;
    this._cuttingSectionsMgr.useIndividualCuttingSections = this._cuttingSectionsMgr.X.getCount() <= 1;
    this._resetCuttingData();
    for (let i = 0; i < planes.length; ++i) {
      const plane = planes[i];
      if (plane === null) {
        continue;
      }
      const sectionIndex = PlaneInfoManager.getPlaneSectionIndex(plane);
      const planeInfo = this._planeInfoMgr.get(sectionIndex);
      if (planeInfo.status === Status.Hidden) {
        planeInfo.status = PlaneInfoManager.getCuttingStatus(sectionIndex, plane);
        planeInfo.plane = plane;
        planeInfo.referenceGeometry = referenceGeometry[i];
      }
    }
    this._viewer.pauseRendering();
    await this._cuttingSectionsMgr.clearAll();
    await this._restorePlanes();
    this._viewer.resumeRendering();
  }
  getReferenceGeometryEnabled() {
    return this._showReferenceGeometry;
  }
  async _updateBoundingBox() {
    const changed = await this._modelBoundingMgr.update(this._viewer);
    if (changed) {
      this._planeInfoMgr.update();
      const activeStates = this._cuttingSectionsMgr.activeStates;
      this._storePlanes();
      await this._cuttingSectionsMgr.clearAll();
      await this._restorePlanes(activeStates);
    }
  }
  _resetCuttingData() {
    this._planeInfoMgr.clear();
    this._faceSelectionMgr.reset();
  }
  resetCuttingPlanes() {
    this._resetCuttingData();
    this._showReferenceGeometry = true;
    return this._cuttingSectionsMgr.clearAll();
  }
  async _initSection() {
    await Promise.all([
      this._modelBoundingMgr.init(this._viewer),
      this._cuttingSectionsMgr.init(this._viewer),
      this._triggerPendingFuncs()
    ]);
  }
  async _triggerPendingFuncs() {
    if (this._pendingFuncs.inverted) {
      const func = this._pendingFuncs.inverted;
      delete this._pendingFuncs.inverted;
      await func();
    }
    if (this._pendingFuncs.visibility) {
      const func = this._pendingFuncs.visibility;
      delete this._pendingFuncs.visibility;
      await func();
    }
  }
  async toggle(sectionIndex) {
    const planeInfo = this._planeInfoMgr.get(sectionIndex);
    switch (planeInfo.status) {
      case Status.Hidden:
        if (sectionIndex === CuttingSectionIndex.Face) {
          const selectionItem = this._viewer.selectionManager.getLast();
          if (selectionItem == null ? void 0 : selectionItem.isFaceSelection()) {
            this._faceSelectionMgr.reset(selectionItem);
            await this._cuttingSectionsMgr.Face.clear();
            planeInfo.status = Status.Visible;
            await this.setCuttingPlaneVisibility(true, sectionIndex);
          }
        } else {
          planeInfo.status = Status.Visible;
          await this.setCuttingPlaneVisibility(true, sectionIndex);
        }
        break;
      case Status.Visible:
        planeInfo.status = Status.Inverted;
        await this.setCuttingPlaneInverted(sectionIndex);
        break;
      case Status.Inverted:
        planeInfo.status = Status.Hidden;
        await this.setCuttingPlaneVisibility(false, sectionIndex);
        break;
    }
  }
  getCount() {
    return this._cuttingSectionsMgr.getCount();
  }
  async setCuttingPlaneVisibility(visibility, sectionIndex) {
    const index = this._cuttingSectionsMgr.getCuttingSectionIndex(sectionIndex);
    const section = this._cuttingSectionsMgr.get(index);
    if (section === void 0) {
      this._pendingFuncs.visibility = async () => {
        await this.setCuttingPlaneVisibility(visibility, sectionIndex);
      };
      return;
    }
    this._viewer.delayCapping();
    if (visibility) {
      const planeInfo = this._planeInfoMgr.get(sectionIndex);
      if (planeInfo.plane === null) {
        planeInfo.plane = this._generateCuttingPlane(sectionIndex);
        planeInfo.referenceGeometry = this._generateReferenceGeometry(sectionIndex);
      }
      await this._setSection(sectionIndex);
    } else {
      await this.refreshPlaneGeometry();
    }
    const count = this.getCount();
    const active = this._cuttingSectionsMgr.isActive(sectionIndex);
    if (count > 0 && !active) {
      await this._cuttingSectionsMgr.activateAll();
    } else if (active && count === 0) {
      await this._cuttingSectionsMgr.deactivate(sectionIndex);
    }
  }
  async setCuttingPlaneInverted(sectionIndex) {
    const section = this._cuttingSectionsMgr.get(
      this._cuttingSectionsMgr.getCuttingSectionIndex(sectionIndex)
    );
    if (section === void 0) {
      this._pendingFuncs.inverted = async () => {
        await this.setCuttingPlaneInverted(sectionIndex);
      };
      return;
    }
    this._viewer.delayCapping();
    const index = this._cuttingSectionsMgr.getPlaneIndex(
      sectionIndex,
      this._faceSelectionMgr.normal
    );
    const plane = section.getPlane(index);
    if (plane) {
      plane.normal.negate();
      plane.d *= -1;
      await section.updatePlane(index, plane, new Matrix(), false, false);
    }
  }
  async toggleReferenceGeometry() {
    if (this.getCount() > 0) {
      this._showReferenceGeometry = !this._showReferenceGeometry;
      await this.refreshPlaneGeometry();
    }
  }
  async refreshPlaneGeometry() {
    this._storePlanes();
    await this._cuttingSectionsMgr.clearAll();
    await this._restorePlanes();
  }
  async toggleCuttingMode() {
    if (this.getCount() > 1) {
      this._storePlanes();
      await this._cuttingSectionsMgr.clearAll();
      this._cuttingSectionsMgr.useIndividualCuttingSections = !this._cuttingSectionsMgr.useIndividualCuttingSections;
      await this._restorePlanes();
    }
  }
  async _setSection(sectionIndex) {
    const { plane, referenceGeometry } = this._planeInfoMgr.get(sectionIndex);
    if (plane === null) {
      return;
    }
    return this._cuttingSectionsMgr.addPlane(
      sectionIndex,
      plane,
      this._showReferenceGeometry ? referenceGeometry : null
    );
  }
  async _restorePlane(sectionIndex) {
    const planeInfo = this._planeInfoMgr.get(sectionIndex);
    if (planeInfo !== void 0 && planeInfo.plane !== null && planeInfo.status !== Status.Hidden) {
      if (planeInfo.referenceGeometry === null || planeInfo.updateReferenceGeometry) {
        planeInfo.referenceGeometry = this._generateReferenceGeometry(sectionIndex);
      }
      await this._setSection(sectionIndex);
    }
  }
  async _restorePlanes(activeStates) {
    await Promise.all([
      this._restorePlane(CuttingSectionIndex.X),
      this._restorePlane(CuttingSectionIndex.Y),
      this._restorePlane(CuttingSectionIndex.Z),
      this._restorePlane(CuttingSectionIndex.Face)
    ]);
    await this._cuttingSectionsMgr.activateAll(activeStates);
  }
  _storePlanes() {
    const planesInfo = new Map(
      [
        CuttingSectionIndex.X,
        CuttingSectionIndex.Y,
        CuttingSectionIndex.Z,
        CuttingSectionIndex.Face
      ].map((sectionIndex) => {
        this._planeInfoMgr.reset(sectionIndex);
        return [sectionIndex, this._planeInfoMgr.get(sectionIndex)];
      }).filter(([sectionIndex, _]) => !this._planeInfoMgr.isHidden(sectionIndex))
    );
    const normal = this._faceSelectionMgr.normal;
    planesInfo.forEach((planeInfo, sectionIndex) => {
      const { plane, referenceGeometry } = this._cuttingSectionsMgr.getPlaneAndGeometry(
        sectionIndex,
        normal
      );
      planeInfo.plane = plane;
      planeInfo.referenceGeometry = referenceGeometry;
    });
  }
  _generateReferenceGeometry(sectionIndex) {
    if (sectionIndex === CuttingSectionIndex.Face) {
      return this._faceSelectionMgr.getReferenceGeometry(this._viewer, this._modelBoundingMgr.box);
    }
    return this._cuttingSectionsMgr.getReferenceGeometry(sectionIndex, this._modelBoundingMgr.box);
  }
  _generateCuttingPlane(sectionIndex) {
    const plane = new Plane();
    const box = this._modelBoundingMgr.box;
    switch (sectionIndex) {
      case CuttingSectionIndex.X:
        plane.normal.set(1, 0, 0);
        plane.d = -box.max.x;
        break;
      case CuttingSectionIndex.Y:
        plane.normal.set(0, 1, 0);
        plane.d = -box.max.y;
        break;
      case CuttingSectionIndex.Z:
        plane.normal.set(0, 0, 1);
        plane.d = -box.max.z;
        break;
      case CuttingSectionIndex.Face:
        if (this._faceSelectionMgr.isSet) {
          const normal = this._faceSelectionMgr.normal;
          const position = this._faceSelectionMgr.position;
          plane.setFromPointAndNormal(position, normal);
        } else {
          return null;
        }
    }
    return plane;
  }
}
export {
  Controller
};
