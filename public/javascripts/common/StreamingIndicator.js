var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { Point2 } from "@hoops/web-viewer";
class StreamingIndicator {
  constructor(elementId, viewer) {
    __publicField(this, "_viewer");
    __publicField(this, "_container");
    __publicField(this, "_bottomLeftOffset", new Point2(10, 10));
    __publicField(this, "_opacity", 0.5);
    __publicField(this, "_spinnerImageUrl", "stylesheets/images/spinner.gif");
    __publicField(this, "_spinnerSize", new Point2(31, 31));
    this._viewer = viewer;
    this._container = document.getElementById(elementId);
    this._initContainer();
    this._viewer.setCallbacks({
      streamingActivated: () => {
        this._onStreamingActivated();
      },
      streamingDeactivated: () => {
        this._onStreamingDeactivated();
      },
      _shutdownBegin: () => {
        this._onStreamingDeactivated();
      }
    });
  }
  show() {
    this._container.style.display = "block";
  }
  hide() {
    this._container.style.display = "none";
  }
  setBottomLeftOffset(point) {
    this._bottomLeftOffset.assign(point);
    this._container.style.left = `${this._bottomLeftOffset.x}px`;
    this._container.style.bottom = `${this._bottomLeftOffset.y}px`;
  }
  getBottomLeftOffset() {
    return this._bottomLeftOffset.copy();
  }
  setSpinnerImage(spinnerUrl, size) {
    this._spinnerImageUrl = spinnerUrl;
    this._spinnerSize.assign(size);
    this._container.style.backgroundImage = `url(${this._spinnerImageUrl})`;
    this._container.style.width = `${this._spinnerSize.x}px`;
    this._container.style.height = `${this._spinnerSize.y}"px`;
  }
  _initContainer() {
    this._container.style.position = "absolute";
    this._container.style.width = `${this._spinnerSize.x}px`;
    this._container.style.height = `${this._spinnerSize.y}px`;
    this._container.style.left = `${this._bottomLeftOffset.x}px`;
    this._container.style.bottom = `${this._bottomLeftOffset.y}px`;
    this._container.style.backgroundImage = `url(${this._spinnerImageUrl})`;
    this._container.style.opacity = `${this._opacity}`;
  }
  _onStreamingActivated() {
    this.show();
  }
  _onStreamingDeactivated() {
    this.hide();
  }
}
export {
  StreamingIndicator
};
