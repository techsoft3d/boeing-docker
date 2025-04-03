var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { CuttingSectionIndex, Status, Info } from "./types.js";
class PlaneInfoManager {
  constructor() {
    /**
     * @member _planeInfoMap a map of plane information for each CuttingSection
     */
    __publicField(this, "_planeInfoMap", /* @__PURE__ */ new Map());
  }
  /**
   * Get the plane Information for CuttingSectionIndex.X
   * @returns the plane Information for CuttingSectionIndex.X
   */
  get X() {
    return this.get(CuttingSectionIndex.X);
  }
  /**
   * Get the plane Information for CuttingSectionIndex.Y
   * @returns the plane Information for CuttingSectionIndex.Y
   */
  get Y() {
    return this.get(CuttingSectionIndex.Y);
  }
  /**
   * Get the plane Information for CuttingSectionIndex.Z
   * @returns the plane Information for CuttingSectionIndex.Z
   */
  get Z() {
    return this.get(CuttingSectionIndex.Z);
  }
  /**
   * Get the plane Information for CuttingSectionIndex.Face
   * @returns the plane Information for CuttingSectionIndex.Face
   */
  get Face() {
    return this.get(CuttingSectionIndex.Face);
  }
  /**
   * Check whether a cutting plane is hidden or not for a given section
   * @param  {CuttingSectionIndex} sectionIndex the section index of the plane to check
   * @returns true if the cutting plane is hidden, false otherwise.
   */
  isHidden(sectionIndex) {
    return this.get(sectionIndex).status === Status.Hidden;
  }
  /**
   * Get the plane information for a given cutting section
   *
   * If the info does not exist in the map it creates it
   *
   * @param  {CuttingSectionIndex} sectionIndex the section index of the info to get
   * @returns the plane information for the given section
   */
  get(sectionIndex) {
    let planeInfo = this._planeInfoMap.get(sectionIndex);
    if (planeInfo === void 0) {
      planeInfo = new Info();
      this._planeInfoMap.set(sectionIndex, planeInfo);
    }
    return planeInfo;
  }
  /**
   * Resets a plane's information
   *
   * Sets plane and referenceGeometry to null
   *
   * @param  {CuttingSectionIndex} sectionIndex
   */
  reset(sectionIndex) {
    const planeInfo = this.get(sectionIndex);
    planeInfo.plane = null;
    planeInfo.referenceGeometry = null;
  }
  /**
   * Deletes the plane's information for a given section in the map
   *
   * @note it will be recreated if get is called with the same section index
   *
   * @param  {CuttingSectionIndex} sectionIndex the section index of the plane's information to delete
   */
  delete(sectionIndex) {
    this._planeInfoMap.delete(sectionIndex);
  }
  /**
   * Deletes all planes' information
   *
   * @note they will be recreated if get is called with each of their section index
   */
  clear() {
    this._planeInfoMap.clear();
  }
  /**
   * Update all planes' info
   *
   * @todo check if this is still necessary after refactoring or if something more elegant is feasible
   */
  update() {
    this._planeInfoMap.forEach((current) => {
      current.updateReferenceGeometry = true;
    });
  }
  /**
   * Get the status of a plane given the plain and its section index
   * @param  {CuttingSectionIndex} sectionIndex the section index of the plane
   * @param  {Plane} plane the plane to get its status
   * @returns {Status} the status of the plane
   */
  static getCuttingStatus(sectionIndex, plane) {
    if (plane.normal.x >= 0 && plane.normal.y >= 0 && plane.normal.z >= 0 || sectionIndex === CuttingSectionIndex.Face) {
      return Status.Visible;
    } else {
      return Status.Inverted;
    }
  }
  /**
   * Get the section index for a given plane based on its normal
   * @param  {Plane} plane the plane to get the section for
   * @returns the section index of the given plane
   */
  static getPlaneSectionIndex(plane) {
    const x = Math.abs(plane.normal.x);
    const y = Math.abs(plane.normal.y);
    const z = Math.abs(plane.normal.z);
    if (x === 1 && y === 0 && z === 0) {
      return CuttingSectionIndex.X;
    } else if (x === 0 && y === 1 && z === 0) {
      return CuttingSectionIndex.Y;
    } else if (x === 0 && y === 0 && z === 1) {
      return CuttingSectionIndex.Z;
    } else {
      return CuttingSectionIndex.Face;
    }
  }
}
export {
  PlaneInfoManager
};
