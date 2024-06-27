// npm install express ejs pg body-parser ejs-locals
const securos = require('securos');
const express = require('express');
const _ = require('lodash');
const {Pool} = require('pg');
const http = require('http');
const WebSocket = require('ws');
const moment = require('moment');
const path = require('path');
const bodyParser = require('body-parser');
const kashefApi = require("kashef_project");
const nunjucks = require('nunjucks');
let CLIENT_ID = "$2a$04$6dTQd1ltXWV52kR6lR2B5uzo7qKF3avT3j6TMUeHzZ0ynxV00cLi2";
let ROOT_DIR = "D:\\ISS\\SA\\1_ZATCA\\1_ABSHIR_SAFAR_INTEGRATION\\abshir_safer"
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});
const uuid = require("uuid");

// VARAIBLES
let SECUROS_CORE = null;
const port = 8998;

// Databases
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'kashif_db',
    port: 5432,
    password: 'postgres'
});

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
class AbshirAPISender {
    // API Microservice
    API_OBJECT_TYPE = "ABSHIR_API";
    API_OBJECT_ID = "1";
    TIME_OUT = 5000;
    // Database Microservice
    DB_API_OBJECT_TYPE = "ABSHIR_DB";
    DB_API_OBJECT_ID = "DB1";
    
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
    insertRequestSourceTravelRequestDb(requestSource, travelRequest) {
        travelRequest = {
            action: travelRequest.action,
            vehicle_registration_type: travelRequest.vehicleRegistrationType,
            vehicle_plate_number: travelRequest.vehiclePlateNumber,
            provider_reference_number: travelRequest.providerReferenceNumber,
            has_towing_trailer: travelRequest.hasTowingTrailer,
            transaction_id: travelRequest.transactionId,
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
    getAllDataDb() {
        return this.senderService(
            this.DB_API_OBJECT_TYPE,
            this.DB_API_OBJECT_ID,
            "getAllData",
            JSON.stringify({}),
            "getAllDataReturn",
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
    res.render('index', {req});
});


// manual_kashif
app.get('/manual_kashif', (req, res) => {
    res.render('manual_kashif', {req});
});


app.post('/manual_kashif', (req, res) => {
    try{
        // console.log(req.body);
        let { plateNumbers, arabicLetters, englishLetters, plateType } = req.body;
        // res.render('manual_kashif', {req});

        let recog_number = `${plateNumbers}${englishLetters}|${arabicLetters}`;
        let lpr_id = "-";
        let cameraId = "CAMERA_ID";
        let date = moment().format('YYYY-MM-DD');
        let time = moment().format('HH:mm:ss.sss');

        // console.log("[*] Recognized car plate: ", recog_number);
        let extractedPlate = extractPlateInfo(recog_number);
        // console.log("[*] Recognized car plate: ", extractPlateInfo(recog_number));
        plateInfo = {
            plateType: plateType,
            plateNumber: extractedPlate.numbers,
            oldPlateNumber: '',
            // arabic
            plateArLetter1: getIndexOrNone(extractedPlate.arabicLetters, 0),
            plateArLetter2: getIndexOrNone(extractedPlate.arabicLetters, 1),
            plateArLetter3: getIndexOrNone(extractedPlate.arabicLetters, 2),
            // english
            plateEnLetter1: getIndexOrNone(extractedPlate.englishLetters, 0),
            plateEnLetter2: getIndexOrNone(extractedPlate.englishLetters, 1),
            plateEnLetter3: getIndexOrNone(extractedPlate.englishLetters, 2)
        }
        console.log("[*] Plate Info: ", plateInfo);

        kashefApi.getVehicleLegalStatusDetailInfoByPlate(
            clientId = CLIENT_ID,
            cameraId = cameraId,
            plateInfo
        ).then((resp) => {
            
            // resp['code'] = _.get(resp, 'code');
            resp['plate_number'] = recog_number;
            resp['plate_type'] = plateInfo['plateType'];
            resp['lpr_id'] = lpr_id;
            resp['camera_id'] = cameraId;
            resp['date'] = date;
            resp['time'] = time;

            if (_.get(resp, 'code') === null) {
                // throw new Error("Got Null Response From Kashif");
                resp['code'] = 'xxx';
                resp['transactionId'] = "-";
                resp['vechiclePrimaryColor'] = "-";
                resp['vechicleSecondaryColor'] = "-";
                resp['vehicleMaker'] = "-";
                resp['vehicleModel'] = "-";
                resp['vehicleManufactureYear'] = "-";
                resp['vehicleWantedStatusCode'] = "-";
                resp['vehicleLegalStatus'] = "-";
                resp['message'] = 'kashif endpoint request is null';
                console.log(resp);
                
                // Store Un Detected Car To Database Asynchronously
                storeVehicleData(resp);

                res.json({
                    success: false, 
                    "kashif_resp": resp,
                    "error": `Plate ${recog_number} Error:  Got Not Found Response From Kashif`
                });   
            } else {
                /*
                vehicleData.plate_number,
                vehicleData.plate_type,
                vehicleData.lpr_id,
                vehicleData.camera_id,
                vehicleData.date,
                vehicleData.time,
                */
                
                // Store To Database Asynchronously
                storeVehicleData(resp);

                // Emmit Kashif Error Message To Clients
                if(_.get(resp, 'code') === "000") {
                    res.json({success: true, "kashif_resp": resp});
                } else {
                    res.json({
                        success: true, 
                        "kashif_resp": resp,
                        "error": `Plate ${recog_number} Error:  ${_.get(resp, 'message')}`
                    });        
                }
            }

        }).catch((e) => {
            // console.log(e);
            res.json({
                success: false, 
                "error": `Plate ${recog_number} Error:  Unable to send request to kashif`
            });
        });
    } catch (error) {
        console.error('Error on /manual_kashif endpoint:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/history/data', async (req, res) => {
    try {
        const pageSize = req.query.pageSize || 10; // Default page size
        const pageNumber = req.query.pageNumber || 1; // Default page number
        const searchQuery = req.query.search || ''; // Default search query
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        // console.log(searchQuery, startDate, endDate);

        const query = `
            SELECT 
                v.id,
                v.transaction_id,
                v.code,
                v.message,
                v.vehicle_primary_color,
                v.vehicle_secondary_color,
                v.vehicle_maker,
                v.vehicle_model,
                v.vehicle_manufacture_year,
                v.vehicle_wanted_status_code,
                v.plate_number,
                v.plate_type,
                v.lpr_id,
                v.camera_id,
                DATE(v.date),
                v.time,
                STRING_AGG(vls.vehicle_legal_status_en, ', ') AS legal_statuses_en,
                STRING_AGG(vls.vehicle_legal_status_ar, ', ') AS legal_statuses_ar
            FROM 
                vehicle v
            LEFT JOIN 
                vehicle_legal_status vls ON v.id = vls.vehicle_id
            WHERE
                v.plate_number LIKE $1
                AND (v.date + v.time) BETWEEN TO_TIMESTAMP($2, 'YYYY-MM-DD HH24:MI:SS')
                AND TO_TIMESTAMP($3, 'YYYY-MM-DD HH24:MI:SS')
            GROUP BY 
                v.id
            ORDER BY 
                v.id DESC
            LIMIT 
                $4 OFFSET $5;
        `;
        // console.log(query);

        const result = await pool.query(query, [`%${searchQuery}%`, startDate, endDate, pageSize, (pageNumber - 1) * pageSize]);
        // console.log(result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error on /history/data endpoint:', error);
        res.status(500).send('Internal Server Error');
    }
});

// CRUD operations
app.get('/history', async (req, res) => {

    try {
        // const pageSize = req.query.pageSize || 10; // Default page size
        // const pageNumber = req.query.pageNumber || 1; // Default page number
        // const searchQuery = req.query.search || ''; // Default search query

        const query = `
            SELECT 
                v.id,
                v.transaction_id,
                v.code,
                v.message,
                v.vehicle_primary_color,
                v.vehicle_secondary_color,
                v.vehicle_maker,
                v.vehicle_model,
                v.vehicle_manufacture_year,
                v.vehicle_wanted_status_code,
                v.plate_number,
                v.plate_type,
                v.lpr_id,
                v.camera_id,
                v.date,
                v.time,
                STRING_AGG(vls.vehicle_legal_status_en, ', ') AS legal_statuses_en,
                STRING_AGG(vls.vehicle_legal_status_ar, ', ') AS legal_statuses_ar
            FROM 
                vehicle v
            LEFT JOIN 
                vehicle_legal_status vls ON v.id = vls.vehicle_id
            GROUP BY 
                v.id
            ORDER BY 
                v.id DESC
        `;

        const result = await pool.query(query, []);
        // res.json(result.rows);
        res.render('history', {req, data: result.rows});
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
    const abshirApi = new AbshirAPISender(core);

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
        // ...
        
        // TODO: Store Result To Database 
        // storeVehicleData(resp);
        // ...

        // TODO: Send Detection to Frontend Via Websocket
        emitEventToClients(
            'abshirSafarGateResult',
            {
                "car_plate": recog_number,
                "resp": {}
            }
        );
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
            vehiclePlateNumber: recog_number, // 'ه ح ح 123',
            providerReferenceNumber: 'ABC-123-xyz',
            hasTowingTrailer: false,
            transactionId: uuid.v1()
        };
        // transaction_id VARCHAR,
        // request_date DATE NOT NULL,
        // request_time TIME NOT NULL,
        let result = await abshirApi.verifyTravelRequest(travelRequest);
        let apiResult = JSON.parse(result.params.api);
        if (apiResult.success) {
            console.log(apiResult);
            console.log("[*] API calling was successful ");
            travelRequest['request_date'] = requestTime.format("YYYY/MM/DD");
            travelRequest['request_time'] = requestTime.format("HH:mm:ss");
            travelRequest['request_status'] = apiResult.status;
            travelRequest['open_gate'] = true;
            // request_status
            let dbDesult = await abshirApi.insertRequestSourceTravelRequestDb(requestSource, travelRequest);
            if (JSON.parse(dbDesult.params.api).success) {
                console.log("[+] Insert DB was successful");
            } else {
                console.error("[!] Insert has errors");
            }

            // getAllDataDb()
            // dbDesult = JSON.parse((await abshirApi.getAllDataDb()).params.api);
            // if (dbDesult.success) {
            //     console.log("[+] DB: \n", dbDesult.result);
            // } else {
            //     console.error("[!] Getting db result error");
            // }
            
        } else {
            if (apiResult.result.status === 403) {
                travelRequest['request_date'] = requestTime.format("YYYY/MM/DD");
                travelRequest['request_time'] = requestTime.format("HH:mm:ss");
                travelRequest['request_status'] = apiResult.status;
                travelRequest['open_gate'] = false;
                // request_status
                let dbDesult = await abshirApi.insertRequestSourceTravelRequestDb(requestSource, travelRequest);
                if (JSON.parse(dbDesult.params.api).success) {
                    console.log("[+] Insert DB was successful");
                } else {
                    console.error("[!] Insert has errors");
                }
            }
            console.error(apiResult);
            console.error("[!] API calling has errors ");
        }

    }

});


function runServer() {
// Start the server
    server.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

runServer();

