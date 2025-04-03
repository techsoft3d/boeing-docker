var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class FaceSelectionManager {
  constructor() {
    /**
     * @member _faceSelection the current face selection item if there is one or null;
     */
    __publicField(this, "_faceSelection", null);
  }
  /**
   * Set the face selection item or reset it to null
   * @param  {Selection.FaceSelectionItem|null=null} item
   */
  reset(item = null) {
    this._faceSelection = item;
  }
  /**
   * @property  isSet is true if the current face selection item is not null
   * @returns true if the current face selection item is not null, false otherwise
   */
  get isSet() {
    return this._faceSelection !== null;
  }
  /**
   * @property normal is the normal of the current face selection entity if any
   * @returns the normal of the current face selection entity if any, undefined otherwise
   */
  get normal() {
    return this._faceSelection ? this._faceSelection.getFaceEntity().getNormal() : void 0;
  }
  /**
   * @property position is the position of the current face selection entity if any
   * @returns the position of the current face selection entity if any, undefined otherwise
   */
  get position() {
    return this._faceSelection ? this._faceSelection.getPosition() : void 0;
  }
  /**
   * Get the reference geometry for the face section.
   * @param  {WebViewer} viewer the WebViewer were the cutting planes are displayed
   * @param  {Box} boundingBox the model bounding box
   * @returns the reference geometry for the face section
   */
  getReferenceGeometry(viewer, boundingBox) {
    if (!this.isSet) {
      return [];
    }
    return viewer.cuttingManager.createReferenceGeometryFromFaceNormal(
      this.normal,
      this.position,
      boundingBox
    );
  }
}
export {
  FaceSelectionManager
};
