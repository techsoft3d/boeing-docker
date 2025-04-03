var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
function escapeHtmlText(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
class PropertyWindow {
  constructor(viewer) {
    __publicField(this, "_viewer");
    __publicField(this, "_propertyWindow");
    __publicField(this, "_assemblyTreeReadyOccurred", false);
    __publicField(this, "_incrementalSelectionActive", false);
    this._viewer = viewer;
    this._propertyWindow = $("#propertyContainer");
    const update = async () => {
      this._update();
    };
    this._viewer.setCallbacks({
      assemblyTreeReady: () => {
        this._onModelStructureReady();
      },
      firstModelLoaded: () => {
        update();
      },
      modelSwitched: () => {
        update();
      },
      selectionArray: (events) => {
        if (events.length > 0) {
          this._onPartSelection(events[events.length - 1]);
        }
      },
      incrementalSelectionBatchBegin: () => {
        this._incrementalSelectionActive = true;
      },
      incrementalSelectionBatchEnd: () => {
        this._incrementalSelectionActive = false;
      }
    });
  }
  _update(text = "&lt;no properties to display&gt;") {
    this._propertyWindow.html(text);
  }
  _onModelStructureReady() {
    this._assemblyTreeReadyOccurred = true;
    this._update();
  }
  _createRow(key, property, classStr = "") {
    const tableRow = document.createElement("tr");
    tableRow.id = `propertyTableRow_${key}_${property}`;
    if (classStr.length > 0) {
      tableRow.classList.add(classStr);
    }
    const keyDiv = document.createElement("td");
    keyDiv.id = `propertyDiv_${key}`;
    keyDiv.innerHTML = key;
    const propertyDiv = document.createElement("td");
    propertyDiv.id = `propertyDiv_${property}`;
    propertyDiv.innerHTML = property;
    tableRow.appendChild(keyDiv);
    tableRow.appendChild(propertyDiv);
    return tableRow;
  }
  async _onPartSelection(event) {
    if (!this._assemblyTreeReadyOccurred || this._incrementalSelectionActive)
      return;
    this._update();
    const model = this._viewer.model;
    const nodeId = event.getSelection().getNodeId();
    if (nodeId === null || !model.isNodeLoaded(nodeId)) {
      return;
    }
    const nodeName = model.getNodeName(nodeId);
    let propertyTable = null;
    let userDataTable = null;
    const props = await model.getNodeProperties(nodeId);
    let propsKeys = [];
    if (props !== null) {
      propsKeys = Object.keys(props);
      if (propsKeys.length > 0) {
        propertyTable = document.createElement("table");
        propertyTable.id = "propertyTable";
        propertyTable.appendChild(this._createRow("Property", "Value", "headerRow"));
        propertyTable.appendChild(this._createRow("Name", nodeName ?? "unnamed"));
        for (const key of propsKeys) {
          const k = escapeHtmlText(key);
          const p = escapeHtmlText(props[key]);
          propertyTable.appendChild(this._createRow(k, p));
        }
      }
    }
    const userDataIndices = model.getNodeUserDataIndices(nodeId);
    if (userDataIndices.length > 0) {
      userDataTable = document.createElement("table");
      userDataTable.id = "propertyTable";
      userDataTable.appendChild(this._createRow("User Data Index", "User Data Size", "headerRow"));
      for (const userDataIndex of userDataIndices) {
        const userData = model.getNodeUserData(nodeId, userDataIndex);
        const k = typeof userDataIndex === "number" ? `0x${userDataIndex.toString(16).toUpperCase()}` : `0x${userDataIndex}`;
        const p = `${userData.length}`;
        userDataTable.appendChild(this._createRow(k, p));
      }
    }
    if (propertyTable === null && userDataTable === null) {
      return;
    }
    this._update("");
    if (propertyTable !== null) {
      this._propertyWindow.append(propertyTable);
    }
    if (userDataTable !== null) {
      this._propertyWindow.append(userDataTable);
    }
  }
}
export {
  PropertyWindow
};
