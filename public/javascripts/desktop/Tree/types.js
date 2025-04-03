var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class TaggedId {
  constructor(id) {
    __publicField(this, "nodeId", null);
    __publicField(this, "guid", null);
    if (typeof id === "number") {
      this.nodeId = id;
    } else {
      this.guid = id;
    }
  }
}
class ContainerMapElement {
  constructor(genericType, index) {
    __publicField(this, "genericType");
    __publicField(this, "index");
    this.genericType = genericType;
    this.index = index;
  }
}
var Tree = /* @__PURE__ */ ((Tree2) => {
  Tree2[Tree2["Model"] = 0] = "Model";
  Tree2[Tree2["CadView"] = 1] = "CadView";
  Tree2[Tree2["Sheets"] = 2] = "Sheets";
  Tree2[Tree2["Configurations"] = 3] = "Configurations";
  Tree2[Tree2["Layers"] = 4] = "Layers";
  Tree2[Tree2["Filters"] = 5] = "Filters";
  Tree2[Tree2["Types"] = 6] = "Types";
  Tree2[Tree2["BCF"] = 7] = "BCF";
  Tree2[Tree2["Relationships"] = 8] = "Relationships";
  return Tree2;
})(Tree || {});
export {
  ContainerMapElement,
  TaggedId,
  Tree
};
