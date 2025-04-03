import { PickConfig, SelectionMask, NodeType, Point2 } from "@hoops/web-viewer";
import { ContextMenu } from "./context-menu/ContextMenu.js";
class RightClickContextMenu extends ContextMenu {
  constructor(containerId, viewer, isolateZoomHelper, colorPicker) {
    super("rightclick", containerId, viewer, isolateZoomHelper, colorPicker);
    this._initEvents();
  }
  _initEvents() {
    this._viewer.setCallbacks({
      contextMenu: (position, modifiers) => {
        this._modifiers = modifiers;
        this.doContext(position);
      }
    });
  }
  async doContext(position) {
    const config = new PickConfig(SelectionMask.All);
    const selectionItem = await this._viewer.view.pickFromPoint(position, config);
    const axisOverlay = 1;
    let nodeType;
    if (selectionItem.isNodeSelection()) {
      nodeType = this._viewer.model.getNodeType(selectionItem.getNodeId());
    }
    if (nodeType === void 0 || nodeType === NodeType.Pmi || nodeType === NodeType.PmiBody || selectionItem.overlayIndex() === axisOverlay) {
      await this.setActiveItemId(null);
    } else {
      await this.setActiveItemId(selectionItem.getNodeId());
    }
    this._position = selectionItem.getPosition();
    this.showElements(position);
  }
  async _onContextLayerClick(event) {
    if (event.button === 2)
      await this.doContext(new Point2(event.pageX, event.pageY));
    else
      super._onContextLayerClick(event);
  }
}
export {
  RightClickContextMenu
};
