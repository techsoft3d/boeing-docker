var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { StreamingMode } from "@hoops/web-viewer";
import { ViewTree } from "../Tree/ViewTree.js";
import { Tree } from "../Tree/types.js";
import { TreeSeparator } from "../Tree/util.js";
import { ContextMenu } from "../../common/context-menu/ContextMenu.js";
class ModelBrowserContextMenu extends ContextMenu {
  constructor(containerId, viewer, treeMap, isolateZoomHelper, colorPicker) {
    super("modelbrowser", containerId, viewer, isolateZoomHelper, colorPicker);
    __publicField(this, "_treeMap");
    this._treeMap = treeMap;
    this._initEvents();
  }
  async _initEvents() {
    await this._registerContextMenuCallback(Tree.Model);
    await this._registerContextMenuCallback(Tree.Layers);
    await this._registerContextMenuCallback(Tree.Types);
    if (this._viewer.getStreamingMode() === StreamingMode.OnDemand) {
      const requestFunc = async () => {
        await this._viewer.model.requestNodes(this.getContextItemIds(false, true));
      };
      this.appendSeparator();
      this.appendItem("request", "Request", requestFunc);
    }
  }
  async _registerContextMenuCallback(tree) {
    const viewTree = this._treeMap.get(tree);
    if (viewTree !== void 0 && viewTree instanceof ViewTree) {
      viewTree.registerCallback("context", async (htmlId, position) => {
        await this._onTreeContext(htmlId, position);
      });
    }
  }
  async _onTreeContext(htmlId, position) {
    const components = htmlId.split(TreeSeparator);
    switch (components[0]) {
      case "layer":
        await this.setActiveLayerName(htmlId);
        break;
      case "types":
        await this.setActiveType(components[1]);
        break;
      case "typespart":
      case "layerpart":
      case "part":
        await this.setActiveItemId(parseInt(components[1], 10));
        break;
      default:
        return;
    }
    this._position = null;
    this.showElements(position);
  }
  _onContextLayerClick(_event) {
    this.hide();
  }
}
export {
  ModelBrowserContextMenu
};
