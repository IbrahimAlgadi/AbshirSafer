// npm install express ejs pg body-parser ejs-locals
const securos = require('securos');
const express = require('express');
const _ = require('lodash');
const http = require('http');
const WebSocket = require('ws');
const moment = require('moment');
// const path = require('path');
const bodyParser = require('body-parser');
const nunjucks = require('nunjucks');
let ROOT_DIR = "D:\\ISS\\SA\\1_ZATCA\\1_ABSHIR_SAFAR_INTEGRATION\\abshir_safer"
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});
const uuid = require("uuid");

// VARAIBLES
let SECUROS_CORE = null;
let abshirApi = null;
const port = 8998;

/**
 * API Services
 */

const VehicleRegistrationTypeModel = {
    PRIVATE: "PRIVATE",
    PRIVATE_TRANSPORT: "PRIVATE_TRANSPORT"
};
const VerificationTypeModel = {
    TRAVEL_REQUEST: "TRAVEL_REQUEST",
    TOLL_FEE: "TOLL_FEE",
    INSURANCE: "INSURANCE"
};
const requestOrigion = {
    N_A: "N_A",
    MANUAL: "MANUAL",
    LPR: "LPR"
}

class AbshirAPISender {
    // API Microservice
    API_OBJECT_TYPE = "ABSHIR_API";
    API_OBJECT_ID = "1";
    TIME_OUT = 5000;
    // Database Microservice
    DB_API_OBJECT_TYPE = "ABSHIR_DB";
    DB_API_OBJECT_ID = "DB1";
    // Relay Microservice
    RELAY_API_OBJECT_TYPE = "RELAY_API";
    RELAY_API_OBJECT_ID = "1";

    
    constructor(core) {
        // console.log(this.API_OBJECT_TYPE);
        this.core = SECUROS_CORE
    }

    senderService(API_OBJECT_TYPE, API_OBJECT_ID, SEND_EVENT_NAME, SEND_EVENT_PARAMS_OBJ, RETURN_EVENT) {
        console.log(API_OBJECT_TYPE, API_OBJECT_ID, SEND_EVENT_NAME, SEND_EVENT_PARAMS_OBJ);
        return new Promise(async (resolve, reject) => {

            let timeount = setTimeout(() => {
                console.log("Request Time Out");
                handler.unregister();
            }, this.TIME_OUT);

            const request_id = uuid.v1();

            let handler = this.core.registerEventHandler(API_OBJECT_TYPE, request_id, RETURN_EVENT, (e) => {
                clearTimeout(timeount);
                // console.log(e);
                resolve(e);
            });

            this.core.sendEvent(API_OBJECT_TYPE, API_OBJECT_ID, SEND_EVENT_NAME, {
                "return_event": RETURN_EVENT,
                "return_uuid": request_id,
                "param": SEND_EVENT_PARAMS_OBJ
            });            

        })
    }

    verifyTravelRequest(params) {
        // console.log(this.API_OBJECT_TYPE);
        return this.senderService(
            this.API_OBJECT_TYPE,
            this.API_OBJECT_ID, 
            "VERIFY_TRAVEL_REQUEST", 
            params, 
            "VERIFY_TRAVEL_REQUEST_RESULT"
        )
    }

    getTravelRequest(params) {
        return this.senderService(
            API_OBJECT_TYPE=this.API_OBJECT_TYPE,
            API_OBJECT_ID=this.API_OBJECT_ID, 
            SEND_EVENT_NAME="GET_TRAVEL_REQUEST", 
            SEND_EVENT_PARAMS_OBJ=params, 
            RETURN_EVENT="GET_TRAVEL_REQUEST_RESULT"
        )
    }

    // insertRequestSourceTravelRequest
    insertRequestSourceTravelRequestDb(requestSource, travelRequest, request_origion=requestOrigion.N_A) {
        travelRequest = {
            action: travelRequest.action,
            vehicle_registration_type: travelRequest.vehicleRegistrationType,
            vehicle_plate_number: travelRequest.vehiclePlateNumber,
            provider_reference_number: travelRequest.providerReferenceNumber,
            has_towing_trailer: travelRequest.hasTowingTrailer,
            transaction_id: travelRequest.transactionId,
            full_plate_number: travelRequest.full_plate_number,
            request_origion,
            request_date: travelRequest.request_date,
            request_time: travelRequest.request_time,
            request_status: travelRequest.request_status,
            open_gate: travelRequest.open_gate
        };

        return this.senderService(
            this.DB_API_OBJECT_TYPE,
            this.DB_API_OBJECT_ID,
            "insertRequestSourceTravelRequest",
            JSON.stringify({
                requestSource, 
                travelRequest
            }),
            "insertRequestSourceTravelRequestReturn",
        )
    }

    // getAllData
    getAllDataDb(pageSize, pageNumber, searchParams, dateRange) {
        return this.senderService(
            this.DB_API_OBJECT_TYPE,
            this.DB_API_OBJECT_ID,
            "getAllData",
            JSON.stringify({pageSize, pageNumber, searchParams, dateRange}),
            "getAllDataReturn",
        )
    }

    relayControlSignal(vehiclePlateNumber, relayId, requestOrigion) {
        return this.senderService(
            this.RELAY_API_OBJECT_TYPE,
            this.RELAY_API_OBJECT_ID,
            "RELAY_CONTROL",
            JSON.stringify({vehiclePlateNumber, relayId, requestOrigion}),
            "RELAY_CONTROL_RETURN",
        )
    }

}


// Set the views directory and EJS as the view engine
// app.set('views', path.join(`${ROOT_DIR}\\views`));
// Serve static files from the public folder
app.use(express.static(`${ROOT_DIR}\\public`));

// Configure Nunjucks
nunjucks.configure(`${ROOT_DIR}\\views`, {
  autoescape: true,
  express: app,
  watch: true
});
// Set Nunjucks as the template engine
app.set('view engine', 'njk');

// app.engine('ejs', require('ejs-locals'));
// app.set('view engine', 'ejs');
// let eta = new Eta({ views: 'C:\\kashif_crud\\views', cache: true });
// Middleware for parsing JSON and URL-encoded form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// CRUD operations
app.get('/', (req, res) => {
    // console.log(req); 
    res.render('index', {req});
});

app.post('/manual', async (req, res) => {
    try{
        // console.log(req.query);
        // console.log(req.body);
        let recognizerId = req.query.recognizerId;
        let cameraId = req.query.cameraId;

        let { 
                vehicleRegistrationType, 
                vehiclePlateNumber, 
                hasTowingTrailer, 
                plateNumbers,
                plateArabicLetters
        } = req.body;
        // res.render('manual_kashif', {req});

        // Get car number
        let recog_number = vehiclePlateNumber;
        let lpr_id = recognizerId;
        let lpr_obj = await SECUROS_CORE.getObject("LPR_CAM", lpr_id);
        let lpr_name = lpr_obj.name;
        let camera_id = cameraId;
        let camera_obj = await SECUROS_CORE.getObject("CAM", camera_id);
        let camera_name = camera_obj.name;
        let requestTime = moment();

        // TODO: Create Request
        let requestSource = {
            lpr_id,
            lpr_name,
            cam_id: camera_id,
            cam_name: camera_name
        };
        let extractedPlate = {
            numbers: plateNumbers,
            arabicLetters: plateArabicLetters
        }
        // console.log(requestSource);
        let travelRequest = {
            action: VerificationTypeModel.TRAVEL_REQUEST,
            vehicleRegistrationType,
            vehiclePlateNumber, // 'ه ح ح 123',
            providerReferenceNumber: 'ABC-123-xyz',
            hasTowingTrailer,
            transactionId: uuid.v1()
        };
        // transaction_id VARCHAR,
        // request_date DATE NOT NULL,
        // request_time TIME NOT NULL,
        let result = await abshirApi.verifyTravelRequest(travelRequest);
        
        let apiResult = JSON.parse(result.params.api);

        // Add data to travelRequest
        travelRequest['full_plate_number'] = recog_number;
        travelRequest['request_date'] = requestTime.format("YYYY/MM/DD");
        travelRequest['request_time'] = requestTime.format("HH:mm:ss");
        travelRequest['request_status'] = apiResult.status;
        // If the proccess of inserting record to database is allowed
        let insertToDb = false;

        if (apiResult.success) {
            // console.log(apiResult);
            console.log("[*] API calling was successful ");
            // TODO: Open Gate
            travelRequest['open_gate'] = true;
            insertToDb = true;
            // TODO: Control Relay
            abshirApi.relayControlSignal(vehiclePlateNumber, camera_id, requestOrigion.LPR);
        } else {
            // TODO: Don't Open Gate
            travelRequest['open_gate'] = false;
            if (apiResult.result.status === 403) {
                insertToDb = true;
            }
            console.error(apiResult);
            console.error("[!] API calling has errors ");
        }

        // insert to database if allowed
        if (insertToDb) {
            let dbDesult = await abshirApi.insertRequestSourceTravelRequestDb(
                requestSource, 
                travelRequest, 
                request_origion=requestOrigion.MANUAL
            );
            if (JSON.parse(dbDesult.params.api).success) {
                console.log("[+] Insert DB was successful");
            } else {                
                console.error("[!] Insert has errors");
            }
        }

        res.json({
            "success": true,
            "travelRequest": travelRequest,
            "requestSource": requestSource,
            "extractedPlate": extractedPlate
        });

    } catch (error) {
        console.error('[!!] Error on /manual endpoint:', error);
        res.status(500).json({
            "success": false,
            "message": "Internal Server Error",
        });
    }
});


app.get('/history/data', async (req, res) => {
    try {
        // console.log(req.query)
        const pageSize = req.query.pageSize || 10; // Default page size
        const pageNumber = req.query.pageNumber || 1; // Default page number
        const searchParams = req.query.search || {}; // Default search query
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        let dbDesult = await abshirApi.getAllDataDb(pageSize, pageNumber, searchParams, {startDate, endDate});
        let parsedDbResult = JSON.parse(dbDesult.params.api);
        // console.log(parsedDbResult)
        if (parsedDbResult.success) {
            res.json(parsedDbResult.result);
        } else {
            res.json([]);            
        }
    } catch (error) {
        console.error('Error on /history/data endpoint:', error);
        res.status(500).send('Internal Server Error');
    }
});

// CRUD operations
app.get('/history', async (req, res) => {

    try {
        const pageSize = req.query.pageSize || 10; // Default page size
        const pageNumber = req.query.pageNumber || 1; // Default page number
        const searchParams = req.query.search || {}; // Default search query
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        let dbDesult = await abshirApi.getAllDataDb(pageSize, pageNumber, searchParams, {startDate, endDate});
        let parsedDbResult = JSON.parse(dbDesult.params.api);
        // console.log(parsedDbResult)
        // if (parsedDbResult.success) {
        //     res.json(parsedDbResult.result);
        // } else {
        //     res.json([]);            
        // }
        // // res.json(result.rows);
        res.render('history', {req, data: parsedDbResult.result});
    } catch (error) {
        console.error('Error on /history endpoint:', error);
        res.status(500).send('Internal Server Error');
    }

    // res.render('history', {req});
});


function extractPlateInfo(license_plate) {
    // Extract numbers
    const numbers = license_plate.match(/\d+/g) || [];
    // Extract Arabic letters
    const arabicLetters = license_plate.match(/[\u0621-\u064A]+/g) || [];
    // .split(/(?:)/u)
    // Extract English letters
    const englishLetters = license_plate.match(/[a-zA-Z]+/g) || [];
    return {
        numbers: numbers[0],
        arabicLetters: arabicLetters[0],
        englishLetters: englishLetters[0]
    }
}

// Store connected clients
const clients = new Set();

wss.on('connection', (ws) => {
    console.log(`[${clients.size}] Client connected`);

    // Add the connected client to the set
    clients.add(ws);

    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
        // Broadcast the message to all connected clients
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // Remove the disconnected client from the set
        clients.delete(ws);
    });
});

// Function to emit an event to all connected clients
function emitEventToClients(event, data) {
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({event, data}));
        }
    });
}

function getIndexOrNone(list, index) {
    try {
        return list[index]
    } catch (e) {
        return ""
    }
}

function getPlateType(inputString) {
    // Define the mapping of substrings to numbers
    const substringMappings = {
        "SA_B": "3",
        "SA_Y": "2",
        "SA_G": "9"
    };

    // Check if the inputString is a substring of any specified string
    for (const substring in substringMappings) {
        if (inputString.includes(substring)) {
            return substringMappings[substring];
        }
    }

    // If no match is found, return the default value (Private)
    return "1";
}

securos.connect((core) => {
    SECUROS_CORE = core;
    abshirApi = new AbshirAPISender(core);

    // Once a car license plate is captured
    core.registerEventHandler(
        'LPR_CAM',
        '*',
        'CAR_LP_RECOGNIZED',
        sendToAbshirSafar
    )

    // send this to abshirSafar
    async function sendToAbshirSafar(e) {
        // console.log(e);
        // Get car number
        let recog_number = e.params.number_utf8;
        let lpr_id = e.params.recognizer_id;
        let lpr_obj = await core.getObject("LPR_CAM", lpr_id);
        let lpr_name = lpr_obj.name;
        let camera_id = e.params.camera_id;
        let camera_obj = await core.getObject("CAM", camera_id);
        // console.log(camera_obj)
        let camera_name = camera_obj.name;
        let requestTime = moment();
        // let date = e.params.date;
        // let time = e.params.time;
        // console.log(recog_number);

        // TODO: Create Request
        let extractedPlate = extractPlateInfo(recog_number);
        let vehiclePlateNumber = `${extractedPlate.numbers} ${extractedPlate.arabicLetters[0]} ${extractedPlate.arabicLetters[1]} ${extractedPlate.arabicLetters[2]}`;
        // console.log(extractedPlate);
        // ...
        
        // TODO: Store Result To Database 
        // storeVehicleData(resp);
        // ...
        let requestSource = {
            lpr_id,
            lpr_name,
            cam_id: camera_id,
            cam_name: camera_name
        };
        // console.log(requestSource);
        let travelRequest = {
            action: VerificationTypeModel.TRAVEL_REQUEST,
            vehicleRegistrationType: VehicleRegistrationTypeModel.PRIVATE,
            vehiclePlateNumber: vehiclePlateNumber, // 'ه ح ح 123',
            providerReferenceNumber: 'ABC-123-xyz',
            hasTowingTrailer: false,
            transactionId: uuid.v1()
        };
        // transaction_id VARCHAR,
        // request_date DATE NOT NULL,
        // request_time TIME NOT NULL,
        let result = await abshirApi.verifyTravelRequest(travelRequest);
        
        let apiResult = JSON.parse(result.params.api);

        // Add data to travelRequest
        travelRequest['full_plate_number'] = recog_number;
        travelRequest['request_date'] = requestTime.format("YYYY/MM/DD");
        travelRequest['request_time'] = requestTime.format("HH:mm:ss");
        travelRequest['request_status'] = apiResult.status;
        // If the proccess of inserting record to database is allowed
        let insertToDb = false;

        if (apiResult.success) {
            // console.log(apiResult);
            console.log("[*] API calling was successful ");
            // TODO: Open Gate
            travelRequest['open_gate'] = true;
            insertToDb = true;
            // TODO: Relay Control Signal
            abshirApi.relayControlSignal(vehiclePlateNumber, camera_id, requestOrigion.LPR);
        } else {
            // TODO: Don't Open Gate
            travelRequest['open_gate'] = false;
            if (apiResult.result.status === 403) {
                insertToDb = true;
            }
            console.error(apiResult);
            console.error("[!] API calling has errors ");
        }

        // insert to database if allowed
        if (insertToDb) {
            let dbDesult = await abshirApi.insertRequestSourceTravelRequestDb(
                requestSource, 
                travelRequest, 
                request_origion=requestOrigion.LPR
            );
            if (JSON.parse(dbDesult.params.api).success) {
                console.log("[+] Insert DB was successful");
            } else {              
                console.error("[!] Insert has errors");
            }
        }

        emitEventToClients(
            'abshirSafarGateResult',
            {
                "success": true,
                "travelRequest": travelRequest,
                "requestSource": requestSource,
                "extractedPlate": extractedPlate
            }
        );

    }

});


function runServer() {
// Start the server
    server.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

runServer();

