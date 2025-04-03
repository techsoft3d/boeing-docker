var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { Box } from "@hoops/web-viewer";
class BoundingManager {
  constructor() {
    /**
     * @member _modelBounding Copy of the bounding box model used as a buffer value yo allow synchronous access
     */
    __publicField(this, "_modelBounding", new Box());
  }
  /**
   * @property @readonly box the latest bounding box
   */
  get box() {
    return this._modelBounding;
  }
  /**
   * Initialize the bounding box with the current model bounding box value
   * @param viewer the WebViewer of the cutting planes
   */
  async init(viewer) {
    this._modelBounding = await viewer.model.getModelBounding(true, false);
  }
  /**
   * update the bounding box if the model bounding box is different than the current one
   * @param viewer the WebViewer of the cutting planes
   * @returns true if the bounding boxed changed, false otherwise
   */
  async update(viewer) {
    const modelBounding = await viewer.model.getModelBounding(true, false);
    const minDiff = this._modelBounding.min.equalsWithTolerance(modelBounding.min, 0.01);
    const maxDiff = this._modelBounding.max.equalsWithTolerance(modelBounding.max, 0.01);
    if (!minDiff || !maxDiff) {
      this._modelBounding = modelBounding;
      return true;
    }
    return false;
  }
}
export {
  BoundingManager
};
