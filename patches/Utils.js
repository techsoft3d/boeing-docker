"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const url = require("url");
const os = require("os");
const SpawnerTypes_1 = require("./SpawnerTypes");
/** Substitutes home-dir for '~/' */
function expandHomeDir(dir) {
    return dir.startsWith("~/") ? path.join(os.homedir(), dir.substring(1)) : dir;
}
exports.expandHomeDir = expandHomeDir;
/** Works like path.resolve(), but handles prefixed home-dir "~/" for 'dir' argument */
function resolveDirs(root, dir) {
    return path.resolve(root, expandHomeDir(dir));
}
exports.resolveDirs = resolveDirs;
/** Sends the given json data and response code for the given request. This will look for URL parameters to determine
 *  if the response should be sent as raw json or somehow prettied or transformed
 */
function sendJsonResponse(req, res, code, json) {
    // Default is to send pretty-printed JSON data. Url param "raw=true" will send the tighter,
    // less human readable raw version
    const parsedUrl = url.parse(req.url, true);
    const rawParam = parsedUrl.query["raw"];
    const isRaw = rawParam && rawParam.toString().toLowerCase() === "true";
    if (isRaw) {
        res.status(200).json(json);
    }
    else {
        // Return a pretty printed JSON
        res.status(200).type("application/json").send(JSON.stringify(json, null, 2));
    }
}
exports.sendJsonResponse = sendJsonResponse;
/** Determines the localhost machine address given the IP-Version type. Note that we're *not*
 * using "localhost" as it's not guaranteed to be a valid hostname for a machine.
 */
function getLocalIpAddress(ipVersion) {
    switch (ipVersion) {
        case SpawnerTypes_1.IPVersion.ForceIPv4:
            return "127.0.0.1";
        case SpawnerTypes_1.IPVersion.ForceIPv6Disabled:
            return "[::1]";
        case SpawnerTypes_1.IPVersion.Auto:
        default:
            return "127.0.0.1";
    }
}
exports.getLocalIpAddress = getLocalIpAddress;
/** Get the appropriate websocket protocol string */
function getWsProtocol(sslEnabled) {
    return sslEnabled ? "wss" : "ws";
}
exports.getWsProtocol = getWsProtocol;
/** Get the appropriate http protocol string */
function getHttpProtocol(sslEnabled) {
    return sslEnabled ? "https" : "http";
}
exports.getHttpProtocol = getHttpProtocol;
/** Gets an appropriate hostname for local use. When using SSL, this may be the public hostname
 *  so that cert verification works as hoped.  */
function getLocalHostname(sslEnabled, publicHostname, ipVersion) {
    if (publicHostname) {
        return publicHostname;
    }
    const hostname = sslEnabled ? publicHostname : getLocalIpAddress(ipVersion);
    return hostname;
}
exports.getLocalHostname = getLocalHostname;
/** Gets an appropriate hostname for public use. If none is specified, just uses local IP address */
function getPublicHostname(publicHostname, ipVersion) {
    const hostname = publicHostname ? publicHostname : getLocalIpAddress(ipVersion);
    return hostname;
}
exports.getPublicHostname = getPublicHostname;
/** Gets an associated reason string for a `ts3d_sc_server` exit code */
function getTs3dScServerExitReason(exitCode) {
    switch (exitCode) {
        case 0:
            return "success";
        case 1:
            return "unexpected exit";
        case 2:
            return "invalid command line argument";
        case 3:
            return "internal error";
        case 4:
            return "failed to initialize the stream-cache";
        case 5:
            return "failed to initialize the curl library";
        case 6:
            return "invalid license";
        case 7:
            return "invalid license file";
        case 8:
            return "service-respawn failed";
        case 9:
            return "unable to get service-respawn exit-code";
    }
    return "unknown exit-code";
}
exports.getTs3dScServerExitReason = getTs3dScServerExitReason;
//# sourceMappingURL=Utils.js.map