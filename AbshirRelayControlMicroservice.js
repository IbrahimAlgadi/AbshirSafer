const securos = require("securos");

API_OBJECT_TYPE = "RELAY_API";
API_OBJECT_ID = "1";


securos.connect(async (core) => {
    console.log("[*] Microservice Started: ");
    console.log("[*] DB_API_OBJECT_TYPE = " + API_OBJECT_TYPE);
    console.log("[*] API_OBJECT_ID = " + API_OBJECT_ID);

    // console.log(core.selfType, core.selfId);
    core.registerEventHandler(API_OBJECT_TYPE, API_OBJECT_ID, "RELAY_CONTROL", (e) => {
        let param = JSON.parse(e.params.param);
        let controlRequest = param;
        console.log(controlRequest);
        let RETURN_EVENT_UUID = e.params.return_uuid;
        let RETURN_EVENT = e.params.return_event;
        console.log(API_OBJECT_TYPE, API_OBJECT_ID, "RELAY_CONTROL", RETURN_EVENT_UUID, RETURN_EVENT);
        
        // TODO: Write Control Relay Logic Here
        core.sendEvent(API_OBJECT_TYPE, RETURN_EVENT_UUID, RETURN_EVENT, {
            "api": JSON.stringify({
                // "result": data,
                "success": true
            })            
        })

    })

});