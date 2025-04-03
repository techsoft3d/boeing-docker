var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { UiDialog } from "./UiDialog.js";
class TimeoutWarningDialog extends UiDialog {
  constructor(containerId, viewer) {
    super(containerId);
    __publicField(this, "_viewer");
    this._viewer = viewer;
    this._viewer.setCallbacks({
      timeoutWarning: () => {
        this._onTimeoutWarning();
      },
      timeout: () => {
        this._onTimeout();
      }
    });
    this.setTitle("Timeout Warning");
  }
  _onTimeoutWarning() {
    this.setText("Your session will expire soon. Press Ok to stay connected.");
    this.show();
  }
  _onOkButtonClick() {
    this._viewer.resetClientTimeout();
    super._onOkButtonClick();
  }
  _onTimeout() {
    this.setText("Your session has been disconnected due to inactivity.");
    this.show();
  }
}
export {
  TimeoutWarningDialog
};
