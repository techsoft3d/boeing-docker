import * as Communicator  from "@hoops/web-viewer";

const modelUIDs = [
       "3804b00f-8197-4ac0-be9b-61fef7bbc914" //boeing full
]

export async function startViewer(resourceLimit ) {
        const conversionServiceURI = "https://boeingscapi.techsoft3d.com";

        var viewer;

        let res = await fetch(conversionServiceURI + '/api/streamingSession');
        var data = await res.json();
        var endpointUriBeginning = 'ws://';

        if(conversionServiceURI.substring(0, 5).includes("https")){
                endpointUriBeginning = 'wss://'
        }

        await fetch(conversionServiceURI + '/api/enableStreamAccess/' + data.sessionid, { method: 'put', headers: { 'items': JSON.stringify(modelUIDs) } });

        viewer = new Communicator.WebViewer({
                containerId: "viewerContainer",
                endpointUri: endpointUriBeginning + data.serverurl + ":" + data.port + '?token=' + data.sessionid,
                model: "boeing-full",
                // streamingMode: Communicator.StreamingMode.OnDemand,
                boundingPreviewMode: Communicator.BoundingPreviewMode.All,
                enginePath: "https://cdn.jsdelivr.net/gh/techsoft3d/hoops-web-viewer@2024.4.0",
                rendererType: 0,
                memoryLimit: resourceLimit
        });

        viewer.start();

        return viewer;

}

