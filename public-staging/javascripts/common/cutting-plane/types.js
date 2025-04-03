var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var CuttingSectionIndex = /* @__PURE__ */ ((CuttingSectionIndex2) => {
  CuttingSectionIndex2[CuttingSectionIndex2["X"] = 0] = "X";
  CuttingSectionIndex2[CuttingSectionIndex2["Y"] = 1] = "Y";
  CuttingSectionIndex2[CuttingSectionIndex2["Z"] = 2] = "Z";
  CuttingSectionIndex2[CuttingSectionIndex2["Face"] = 3] = "Face";
  CuttingSectionIndex2[CuttingSectionIndex2["CadView"] = 4] = "CadView";
  return CuttingSectionIndex2;
})(CuttingSectionIndex || {});
var Status = /* @__PURE__ */ ((Status2) => {
  Status2[Status2["Hidden"] = 0] = "Hidden";
  Status2[Status2["Visible"] = 1] = "Visible";
  Status2[Status2["Inverted"] = 2] = "Inverted";
  return Status2;
})(Status || {});
class Info {
  constructor() {
    __publicField(this, "plane", null);
    __publicField(this, "referenceGeometry", null);
    __publicField(this, "status", 0);
    __publicField(this, "updateReferenceGeometry", false);
  }
}
export {
  CuttingSectionIndex,
  Info,
  Status
};
