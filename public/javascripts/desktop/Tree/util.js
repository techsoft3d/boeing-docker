const TreeSeparator = "_";
const TreeVisibilityPrefix = "visibility";
function getComponentPartId(id) {
  return `typespart${TreeSeparator}${id}`;
}
function getGenericTypeId(genericType) {
  return `types${TreeSeparator}${genericType}`;
}
function getContainerId(uuid) {
  return `container${TreeSeparator}${uuid}`;
}
const TreeLayerPrefix = "layer";
const TreeLayerPartPrefix = "layerpart";
const TreeLayerPartContainerPrefix = "layerpartcontainer";
const _layerIdMap = /* @__PURE__ */ new Map();
const _idLayerMap = /* @__PURE__ */ new Map();
const _layerPartIdMap = /* @__PURE__ */ new Map();
const _idLayerPartMap = /* @__PURE__ */ new Map();
function TreeGetLayerName(layerId) {
  return _layerIdMap.get(layerId) || null;
}
function TreeGetLayerId(layerName) {
  return _idLayerMap.get(layerName) || null;
}
function TreeGetPartId(layerPartId) {
  return _layerPartIdMap.get(layerPartId) || null;
}
function TreeGetLayerPartId(nodeId) {
  return _idLayerPartMap.get(nodeId) || null;
}
export {
  TreeGetLayerId,
  TreeGetLayerName,
  TreeGetLayerPartId,
  TreeGetPartId,
  TreeLayerPartContainerPrefix,
  TreeLayerPartPrefix,
  TreeLayerPrefix,
  TreeSeparator,
  TreeVisibilityPrefix,
  getComponentPartId,
  getContainerId,
  getGenericTypeId
};
