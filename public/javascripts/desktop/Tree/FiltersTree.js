import { ViewTree } from "./ViewTree.js";
import { TreeSeparator } from "./util.js";
class FiltersTree extends ViewTree {
  constructor(viewer, elementId, iScroll) {
    super(viewer, elementId, iScroll);
    this._tree.setCreateVisibilityItems(false);
    this._initEvents();
  }
  _initEvents() {
    const onNewModel = () => {
      this._onNewModel();
    };
    this._viewer.setCallbacks({
      assemblyTreeReady: onNewModel,
      firstModelLoaded: onNewModel,
      modelSwitched: onNewModel,
      subtreeLoaded: onNewModel
    });
    this._tree.registerCallback("selectItem", async (htmlId) => {
      await this._onTreeSelectItem(htmlId);
    });
  }
  async _onTreeSelectItem(htmlId) {
    const thisElement = document.getElementById(htmlId);
    if (thisElement === null) {
      return;
    }
    const idParts = this._splitHtmlId(htmlId);
    if (idParts[0] === this._internalId) {
      await this._setFilter(parseInt(idParts[1], 10));
    }
  }
  async _setFilter(filterId) {
    const model = await this._viewer.model;
    const filteredNodes = model.getNodesFromFiltersId([filterId]);
    if (filteredNodes !== null) {
      const nodeIds = [];
      filteredNodes.nodeIds.forEach((nodeId) => {
        nodeIds.push(nodeId);
      });
      await this._viewer.pauseRendering();
      await model.reset();
      if (filteredNodes.isInclusive) {
        await model.setNodesVisibility([model.getAbsoluteRootNode()], false);
        await model.setNodesVisibility(nodeIds, true);
      } else {
        await model.setNodesVisibility(nodeIds, false);
      }
      await this._viewer.resumeRendering();
    }
  }
  _onNewModel() {
    this._tree.clear();
    const filters = this._viewer.model.getFilters();
    filters.forEach((filterName, filterId) => {
      this._tree.appendTopLevelElement(filterName, this.getFilterId(filterId), "assembly", false);
    });
    if (filters.size > 0) {
      this.showTab();
    } else {
      this.hideTab();
    }
  }
  getFilterId(id) {
    return this._internalId + TreeSeparator + id;
  }
}
export {
  FiltersTree
};
