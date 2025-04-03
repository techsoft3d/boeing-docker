var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { Axis } from "@hoops/web-viewer";
import { CuttingSectionIndex } from "./types.js";
class CuttingSectionManager {
  constructor() {
    /**
     * @member _useIndividualCuttingSections a boolean representing whether the cutting section is done on a single plane or not
     */
    __publicField(this, "_useIndividualCuttingSections", true);
    /**
     * @member _cuttingManager The CuttingManager of the WebViewer where the cutting planes are drawn
     */
    __publicField(this, "_cuttingManager", null);
  }
  /**
   * @property useIndividualCuttingSections getter
   * @returns  a boolean representing whether the cutting section is done on a single plane or not
   */
  get useIndividualCuttingSections() {
    return this._useIndividualCuttingSections;
  }
  /**
   * @property useIndividualCuttingSections setter
   *
   * @todo check if this can be remove and internalize the handling of this value or make it public
   *
   * @param  {boolean} value
   */
  set useIndividualCuttingSections(value) {
    this._useIndividualCuttingSections = value;
  }
  /**
   * @property X get the CuttingSection for CuttingSectionIndex.X
   * @returns The CuttingSection for CuttingSectionIndex.X
   */
  get X() {
    if (!this._cuttingManager) {
      throw new Error("Ui.CuttingSectionManager as not been initialized");
    }
    return this._cuttingManager.getCuttingSection(CuttingSectionIndex.X);
  }
  /**
   * @property Y get the CuttingSection for CuttingSectionIndex.Y
   * @returns The CuttingSection for CuttingSectionIndex.Y
   */
  get Y() {
    if (!this._cuttingManager) {
      throw new Error("Ui.CuttingSectionManager as not been initialized");
    }
    return this._cuttingManager.getCuttingSection(CuttingSectionIndex.Y);
  }
  /**
   * @property Z get the CuttingSection for CuttingSectionIndex.Z
   * @returns The CuttingSection for CuttingSectionIndex.Z
   */
  get Z() {
    if (!this._cuttingManager) {
      throw new Error("Ui.CuttingSectionManager as not been initialized");
    }
    return this._cuttingManager.getCuttingSection(CuttingSectionIndex.Z);
  }
  /**
   * @property Face get the CuttingSection for CuttingSectionIndex.Face
   * @returns The CuttingSection for CuttingSectionIndex.Face
   */
  get Face() {
    if (!this._cuttingManager) {
      throw new Error("Ui.CuttingSectionManager as not been initialized");
    }
    return this._cuttingManager.getCuttingSection(CuttingSectionIndex.Face);
  }
  /**
   * @property activeStates get an array of boolean representing whether a plane in
   * [CuttingSectionIndex.X, CuttingSectionIndex.Y, CuttingSectionIndex.Z, CuttingSectionIndex.Face]
   * is active
   * @returns boolean
   */
  get activeStates() {
    return [
      this.isActive(CuttingSectionIndex.X),
      this.isActive(CuttingSectionIndex.Y),
      this.isActive(CuttingSectionIndex.Z),
      this.isActive(CuttingSectionIndex.Face)
    ];
  }
  /**
   * @property planes get planes in either CuttingSectionIndex.X CuttingSection if its count is greater than 1
   * or every first plane of every section in
   * [CuttingSectionIndex.X, CuttingSectionIndex.Y, CuttingSectionIndex.Z, CuttingSectionIndex.Face]
   *
   * @todo check whether the X part is not something that must be modified due to refactoring (support use
   * individual on other section index)
   *
   * @returns an array of four cells containing either a plane or null.
   */
  get planes() {
    if (this.X.getCount() > 1) {
      return [...Array(4)].map((_, index) => this.X.getPlane(index));
    } else {
      return [this.X, this.Y, this.Z, this.Face].map((current) => current.getPlane(0));
    }
  }
  /**
   * @property referenceGeometry get the reference geometry in either CuttingSectionIndex.X CuttingSection if its count
   * is greater than 1 or every first reference geometry of every section in
   * [CuttingSectionIndex.X, CuttingSectionIndex.Y, CuttingSectionIndex.Z, CuttingSectionIndex.Face]
   *
   * @todo check whether the X part is not something that must be modified due to refactoring (support use
   * individual on other section index)
   *
   * @returns an array of four cells containing either a plane or null.
   */
  get referenceGeometry() {
    if (this.X.getCount() > 1) {
      return [...Array(4)].map((_, index) => this.X.getReferenceGeometry(index));
    } else {
      return [this.X, this.Y, this.Z, this.Face].map(
        (current) => current.getReferenceGeometry(0)
      );
    }
  }
  /**
   * Get a Cutting Section given an index
   * @param sectionIndex The index of the cutting section
   * @returns The appropriate cutting section for this index from the cutting manager
   */
  get(sectionIndex) {
    if (!this._cuttingManager) {
      throw new Error("Ui.CuttingSectionManager as not been initialized");
    }
    return this._cuttingManager.getCuttingSection(sectionIndex);
  }
  /**
   * Get the total number of planes for all sections.
   * @returns the total number of planes for all sections.
   */
  getCount() {
    return [this.X, this.Y, this.Z, this.Face].reduce(
      (currentValue, section) => currentValue + section.getCount(),
      0
    );
  }
  /**
   * Initialize the component and store a reference to the CuttingManager of the WebViewer
   * @param viewer The viewer where the cutting planes to manage are
   */
  init(viewer) {
    this._cuttingManager = viewer.cuttingManager;
  }
  /**
   * Check whether a section is active or not.
   *
   * @throws Error if the CuttingSectionManager has not been initialized yet
   * @param  {CuttingSectionIndex} sectionIndex
   * @returns a boolean that represent whether a section is active or not
   */
  isActive(sectionIndex) {
    if (!this._cuttingManager) {
      throw new Error("Ui.CuttingSectionManager as not been initialized");
    }
    return this.get(sectionIndex).isActive();
  }
  /**
   * Activate a plane if the section count is greater than 0
   * @param  {CuttingSectionIndex} sectionIndex the index of the plane to activate
   *
   * @todo improve this API, a function cannot silently fail like that at least return a boolean
   *
   * @returns Promise a promise returning when the plane has been activated or not
   */
  async activate(sectionIndex) {
    const section = this.get(sectionIndex);
    if (section.getCount() > 0) {
      return section.activate();
    }
  }
  /**
   * Activate all planes if the section count is greater than 0 depending on activeStates
   * if activeStates is undefined every planes are activated (if possible)
   * if activeStates is defined
   *  - activeStates[0] triggers activation of CuttingSectionIndex.X
   *  - activeStates[1] triggers activation of CuttingSectionIndex.Y
   *  - activeStates[2] triggers activation of CuttingSectionIndex.Z
   *  - activeStates[3] triggers activation of CuttingSectionIndex.Face
   *
   * @param  {activeStates} activeStates
   *
   * @todo improve this API, a function cannot silently fail like that at least return a boolean array
   * @todo improve this API, use named fields for activeStates
   *
   * @returns Promise a promise returning when the plane has been activated or not
   */
  async activateAll(activeStates) {
    await Promise.all(
      [
        CuttingSectionIndex.X,
        CuttingSectionIndex.Y,
        CuttingSectionIndex.Z,
        CuttingSectionIndex.Face
      ].map(
        (current, index) => !activeStates || activeStates[index] ? this.activate(current) : null
      ).filter(Boolean)
    );
  }
  /**
   * Deactivate a plane
   * @param  {CuttingSectionIndex} sectionIndex the index of the plane to deactivate
   *
   * @todo improve this API, a function cannot silently fail like that at least return a boolean
   *
   * @returns Promise a promise returning when the plane has been activated or not
   */
  deactivate(sectionIndex) {
    return this.get(this.getCuttingSectionIndex(sectionIndex)).deactivate();
  }
  /**
   * Get the section index based on whether useIndividualCuttingSections is set or not.
   * Return CuttingSectionIndex.X (0) if useIndividualCuttingSections is set, sectionIndex otherwise.
   *
   * @todo maybe we can improve this API by aliasing the CuttingSectionIndex.X (0) with something like CuttingSectionIndividual = 0
   *
   * @param sectionIndex the index of the desired section
   * @returns CuttingSectionIndex.X (0) if useIndividualCuttingSections is set, sectionIndex otherwise
   */
  getCuttingSectionIndex(sectionIndex) {
    return this.useIndividualCuttingSections ? sectionIndex : CuttingSectionIndex.X;
  }
  /**
   * Clear a CuttingSection given its index
   * @param  {CuttingSectionIndex} sectionIndex the index of the section to clear
   * @returns a promise resolved with void on completion
   */
  async clear(sectionIndex) {
    return this.get(sectionIndex).clear();
  }
  /**
   * Clear a CuttingSection given its index
   * @param  {CuttingSectionIndex} sectionIndex the index of the section to clear
   * @returns a promise resolved with void on completion
   */
  async clearAll() {
    const ps = [
      CuttingSectionIndex.X,
      CuttingSectionIndex.Y,
      CuttingSectionIndex.Z,
      CuttingSectionIndex.Face
    ].map(async (current) => this.clear(current));
    await Promise.all(ps);
  }
  /**
   * get the index of a plane given section index
   * @param  {CuttingSectionIndex} sectionIndex the index of the section of the plane
   * @param  {Point3} normal? an optional normal used if sectionIndex === CuttingSectionIndex.Face
   * @returns the index of the plane according to the sec or -1 if not found.
   */
  getPlaneIndex(sectionIndex, normal) {
    if (this._useIndividualCuttingSections) {
      const section = this.get(this.getCuttingSectionIndex(sectionIndex));
      if (section.getPlane(0)) {
        return 0;
      }
    } else {
      const section = this.get(0);
      const planeCount = section.getCount();
      for (let i = 0; i < planeCount; i++) {
        const plane = section.getPlane(i);
        if (plane) {
          if (plane.normal.x && sectionIndex === CuttingSectionIndex.X || plane.normal.y && sectionIndex === CuttingSectionIndex.Y || plane.normal.z && sectionIndex === CuttingSectionIndex.Z || sectionIndex === CuttingSectionIndex.Face && normal && plane.normal.equals(normal)) {
            return i;
          }
        }
      }
    }
    return -1;
  }
  /**
   * Get the plane and the reference geometry for a given section index
   * @param  {CuttingSectionIndex} sectionIndex the section index of the data to get
   * @param  {Point3} normal? an optional normal used if sectionIndex === CuttingSectionIndex.Face
   * @returns {plane: Plane | null; referenceGeometry: Point3[] | null} an Object containing the
   * plane or null as plane and the reference geometry or null as referenceGeometry
   */
  getPlaneAndGeometry(sectionIndex, normal) {
    const section = this.get(this.getCuttingSectionIndex(sectionIndex));
    if (section.getCount() <= 0) {
      return {
        plane: null,
        referenceGeometry: null
      };
    }
    const planeIndex = this.getPlaneIndex(sectionIndex, normal);
    const plane = section.getPlane(planeIndex);
    const referenceGeometry = section.getReferenceGeometry(planeIndex);
    return { plane, referenceGeometry };
  }
  /**
   * Get the reference geometry for a given section index
   *
   * @param  {CuttingSectionIndex} sectionIndex the section index of the reference geometry to get
   * @param  {Box} boundingBox the bounding box of the model
   * @returns {Point3[]} the reference geometry of the section
   */
  getReferenceGeometry(sectionIndex, boundingBox) {
    if (!this._cuttingManager) {
      throw new Error("Ui.CuttingSectionManager as not been initialized");
    }
    let axis;
    switch (sectionIndex) {
      case CuttingSectionIndex.X:
        axis = Axis.X;
        break;
      case CuttingSectionIndex.Y:
        axis = Axis.Y;
        break;
      case CuttingSectionIndex.Z:
        axis = Axis.Z;
        break;
    }
    if (axis !== void 0) {
      return this._cuttingManager.createReferenceGeometryFromAxis(axis, boundingBox);
    }
    return [];
  }
  /**
   * Add a plane to a section
   * @param  {CuttingSectionIndex} sectionIndex the section where the plane should be added
   * @param  {Plane} plane the plane to add.
   * @param  {Point[]|null} referenceGeometry the reference geometry of the plane or null
   * @returns Promise a promise completed with undefined when its done
   */
  async addPlane(sectionIndex, plane, referenceGeometry) {
    await this.get(this.getCuttingSectionIndex(sectionIndex)).addPlane(
      plane,
      referenceGeometry
    );
  }
}
export {
  CuttingSectionManager
};
