import { Color } from "@hoops/web-viewer";
const DefaultUiTransitionDuration = 400;
function colorFromRgbString(rgbStr) {
  const rgb = rgbStr.replace(/[^\d,]/g, "").split(",");
  return new Color(Number(rgb[0]), Number(rgb[1]), Number(rgb[2]));
}
function rgbStringFromColor(color) {
  if (!color) {
    return "";
  }
  return `rgb(${Math.round(color.r)},${Math.round(color.g)},${Math.round(color.b)})`;
}
function cssHexStringFromColor(color) {
  const hex = (n) => {
    const s = n.toString(16);
    return s.length === 1 ? `0${s}` : s;
  };
  return `#${hex(color.r)}${hex(color.g)}${hex(color.b)}`;
}
function getValueAsString(id) {
  const elm = document.querySelector(id);
  const value = elm.value;
  if (typeof value === "string") {
    return value;
  }
  return "";
}
function centerWindow(htmlId, canvasSize) {
  const $window = document.querySelector(`#${htmlId}`);
  const width = $window.offsetWidth;
  const height = $window.offsetHeight;
  if (width !== void 0 && height !== void 0) {
    const leftPos = (canvasSize.x - width) / 2;
    const topPos = (canvasSize.y - height) / 2;
    $window.style.left = `${leftPos}px`;
    $window.style.top = `${topPos}px`;
  }
}
export {
  DefaultUiTransitionDuration,
  centerWindow,
  colorFromRgbString,
  cssHexStringFromColor,
  getValueAsString,
  rgbStringFromColor
};
