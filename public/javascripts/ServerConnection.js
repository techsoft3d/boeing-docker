class ServerConnection {
  constructor(endpoint) {
    this._endpoint = endpoint;
  }

  connect() {
    var _this = this;
    var request = new XMLHttpRequest();
    request.open("POST", this._endpoint + "/api/spawn");
    request.overrideMimeType("application/json");
    request.setRequestHeader("Content-Type", "application/json");
    request.timeout = 60000;

    var promise = new Promise(function (resolve, reject) {
      request.onreadystatechange = function () {
        if (request.readyState == 4) {
          if (request.status == 200) {
            resolve(_this.parseServerSuccessResponse(request.responseText));
          } else {
            reject(alert("Couldn't Connect"));
          }
        }
      };

      request.send('{"class":"csr_session","params":{}}');
    });

    return promise;
  }

  parseServerSuccessResponse(text) {
    this._jsonResponse = JSON.parse(text);
    let rawWsUri = this._jsonResponse.endpoints["ws"];

    // Extract the port and session path
    const url = new URL(rawWsUri);
    const port = url.port;
    const sessionPath = url.pathname; // e.g., /session/abc123

    // Rewrite to match Nginx WebSocket proxy
    this._endpointuri = `wss://${window.location.hostname}/wsproxy/${port}${sessionPath}`;
  }
}
