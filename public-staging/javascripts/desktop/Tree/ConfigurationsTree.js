import { OperatorId } from "@hoops/web-viewer";
import { ViewTree } from "./ViewTree.js";
import { TreeSeparator } from "./util.js";
import { Tree } from "./types.js";
class ConfigurationsTree extends ViewTree {
  constructor(viewer, elementId, iScroll) {
    super(viewer, elementId, iScroll);
    this._tree.setCreateVisibilityItems(false);
    this._initEvents();
  }
  _initEvents() {
    this._viewer.setCallbacks({
      firstModelLoaded: async () => {
        await this._onNewModel();
      },
      modelSwitched: async () => {
        await this._modelSwitched();
      },
      configurationActivated: (id) => {
        this._tree.selectItem(this._configurationsId(id), false);
      }
    });
    this._tree.registerCallback("selectItem", async (id) => {
      await this._onTreeSelectItem(id);
    });
  }
  _modelSwitched() {
    return this._onNewModel();
  }
  async _onNewModel() {
    const model = this._viewer.model;
    if (await model.cadConfigurationsEnabled()) {
      if (this._createConfigurationNodes()) {
        this.showTab();
      } else {
        this.hideTab();
      }
    }
  }
  _createConfigurationNodes() {
    const configurations = this._viewer.model.getCadConfigurations();
    const keys = Object.keys(configurations);
    if (keys.length > 0) {
      this._tree.appendTopLevelElement("Configurations", this._internalId, "configurations", true);
      for (const key of keys) {
        const nodeId = parseInt(key, 10);
        this._tree.addChild(
          configurations[nodeId],
          this._configurationsId(nodeId),
          this._internalId,
          "view",
          false,
          Tree.Configurations
        );
      }
      this._tree.expandInitialNodes(this._internalId);
      return true;
    }
    return false;
  }
  async _onTreeSelectItem(htmlId) {
    const idParts = this._splitHtmlId(htmlId);
    if (this._internalId === idParts[0]) {
      await this._viewer.operatorManager.getOperator(OperatorId.Handle).removeHandles();
      await this._viewer.model.activateCadConfiguration(parseInt(idParts[1], 10));
    }
  }
  _configurationsId(nodeId) {
    return this._internalId + TreeSeparator + nodeId;
  }
}
export {
  ConfigurationsTree
};
