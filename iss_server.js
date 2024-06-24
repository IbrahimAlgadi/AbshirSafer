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
let CLIENT_ID = "$2a$04$6dTQd1ltXWV52kR6lR2B5uzo7qKF3avT3j6TMUeHzZ0ynxV00cLi2";
let ROOT_DIR = "D:\\ISS\\SA\\3_KAPSARC\\Kashif\\kashif_crud"
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});

const port = 8991;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'kashif_db',
    port: 5432,
    password: 'postgres'
});

// Set the views directory and EJS as the view engine
app.set('views', path.join(`${ROOT_DIR}\\views`));
// Serve static files from the public folder
app.use(express.static(`${ROOT_DIR}\\public`));
app.engine('ejs', require('ejs-locals'));
app.set('view engine', 'ejs');
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


app.get('/statistics/correct_fault_total_responses', async (req, res) => {
    try {
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        // console.log(searchQuery, startDate, endDate);

        const query = `
-- Report Query 1
SELECT
    COUNT(v.id) AS total_responses,
    SUM(CASE WHEN v.code = 'xxx' THEN 0 ELSE 1 END) AS correct_responses,
    SUM(CASE WHEN v.code = 'xxx' THEN 1 ELSE 0 END) AS faulty_responses
FROM
    vehicle v
WHERE
    (CAST(v.date AS text) || ' ' || CAST(v.time AS text))::timestamp
        BETWEEN TO_TIMESTAMP($1, 'YYYY-MM-DD HH24:MI:SS')
        AND TO_TIMESTAMP($2, 'YYYY-MM-DD HH24:MI:SS');
        `;
        // console.log(query);

        const result = await pool.query(query, [startDate, endDate]);
        // console.log(result.rows);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error on /statistics/correct_fault_total_responses endpoint:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/statistics/wantedStatusCode', async (req, res) => {
    try {
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        // console.log(searchQuery, startDate, endDate);

        const query = `
SELECT
    v.vehicle_wanted_status_code,
    COUNT(*) AS total
FROM
    vehicle v
WHERE
    v.code != 'xxx'
    AND (CAST(v.date AS text) || ' ' || CAST(v.time AS text))::timestamp
        BETWEEN TO_TIMESTAMP($1, 'YYYY-MM-DD HH24:MI:SS')
        AND TO_TIMESTAMP($2, 'YYYY-MM-DD HH24:MI:SS')
GROUP BY
    v.vehicle_wanted_status_code
ORDER BY
    total DESC;
        `;
        // console.log(query);

        const result = await pool.query(query, [startDate, endDate]);
        // console.log(result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error on /statistics/correct_fault_total_responses endpoint:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/statistics/legalStatusCode', async (req, res) => {
    try {
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        // console.log(searchQuery, startDate, endDate);

        const query = `
SELECT
    vls.vehicle_legal_status_code,
    COUNT(vls.vehicle_legal_status_code) AS status_count
FROM
    vehicle v
JOIN
    vehicle_legal_status vls ON v.id = vls.vehicle_id
WHERE
    v.code <> 'xxx'
    AND (CAST(v.date AS text) || ' ' || CAST(v.time AS text))::timestamp
        BETWEEN TO_TIMESTAMP($1, 'YYYY-MM-DD HH24:MI:SS')
        AND TO_TIMESTAMP($2, 'YYYY-MM-DD HH24:MI:SS')
GROUP BY
    vls.vehicle_legal_status_code
ORDER BY
    status_count DESC;
        `;
        // console.log(query);

        const result = await pool.query(query, [startDate, endDate]);
        // console.log(result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error on /statistics/correct_fault_total_responses endpoint:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Render Template
app.get('/statistics', async (req, res) => {

    try {
        // res.json(result.rows);
        res.render('statistics', {req});
    } catch (error) {
        console.error('Error on /history endpoint:', error);
        res.status(500).send('Internal Server Error');
    }

    // res.render('history', {req});
});


async function storeVehicleData(vehicleData) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const vehicleQuery = `
            INSERT INTO vehicle (
                transaction_id, 
                code, 
                message, 
                vehicle_primary_color, 
                vehicle_secondary_color, 
                vehicle_maker, 
                vehicle_model, 
                vehicle_manufacture_year, 
                vehicle_wanted_status_code,
                plate_number,
                plate_type,
                lpr_id,
                camera_id,
                date,
                time
            ) VALUES (
                $1, 
                $2, 
                $3, 
                $4, 
                $5, 
                $6, 
                $7, 
                $8, 
                $9,
                $10,
                $11,
                $12,
                $13,
                $14,
                $15
            ) RETURNING id
        `;

        const vehicleValues = [
            _.get(vehicleData,'transactionId', ''),
            _.get(vehicleData,'code', ''),
            _.get(vehicleData,'message', ''),
            _.get(vehicleData,'vechiclePrimaryColor', ''),
            _.get(vehicleData,'vechicleSecondaryColor', ''),
            _.get(vehicleData,'vehicleMaker', ''),
            _.get(vehicleData,'vehicleModel', ''),
            _.get(vehicleData,'vehicleManufactureYear', ''),
            _.get(vehicleData,'vehicleWantedStatusCode', ''),
            _.get(vehicleData,'plate_number'),
            _.get(vehicleData,'plate_type'),
            _.get(vehicleData,'lpr_id'),
            _.get(vehicleData,'camera_id'),
            _.get(vehicleData,'date'),
            _.get(vehicleData,'time'),
        ];

        const res = await client.query(vehicleQuery, vehicleValues);
        const vehicleId = res.rows[0].id;

        for (const status of _.get(vehicleData, 'vehicleLegalStatus', [])) {
            const statusQuery = `
                INSERT INTO vehicle_legal_status (
                    vehicle_id, 
                    vehicle_legal_status_code, 
                    vehicle_legal_status_ar, 
                    vehicle_legal_status_en
                ) VALUES ($1, $2, $3, $4)`;

            const statusValues = [
                vehicleId,
                status.vehicleLegalStatusCode,
                status.vehicleLegalStatusAr,
                status.vehicleLegalStatusEn
            ];

            await client.query(statusQuery, statusValues);
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

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

    core.registerEventHandler(
        'LPR_CAM',
        '*',
        'CAR_LP_RECOGNIZED',
        sendCarFoundToKashef
    )

    function sendCarFoundToKashef(e) {
        // console.log(e);
        // Get car number
        let recog_number = e.params.number_utf8;
        let lpr_id = e.params.recognizer_id;
        let camera_id = e.params.camera_id;
        let date = e.params.date;
        let time = e.params.time;

        // console.log("[*] Recognized car plate: ", recog_number);
        let extractedPlate = extractPlateInfo(recog_number);
        // console.log("[*] Recognized car plate: ", extractPlateInfo(recog_number));
        plateInfo = {
            plateType: getPlateType(e.params.template_name),
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
            cameraId = '2345666433',
            plateInfo
        ).then((resp) => {
            console.log(resp);
            if (_.get(resp, 'code') === null) {
                throw new Error("Got Null Response From Kashif");
            }
            /*
            vehicleData.plate_number,
            vehicleData.plate_type,
            vehicleData.lpr_id,
            vehicleData.camera_id,
            vehicleData.date,
            vehicleData.time,
            */
            resp['plate_number'] = recog_number;
            resp['plate_type'] = plateInfo['plateType'];
            resp['lpr_id'] = lpr_id;
            resp['camera_id'] = camera_id;
            resp['date'] = moment(date, "DD-MM-YY").format('YYYY-MM-DD');
            resp['time'] = time;

            // Store To Database Asynchronously
            storeVehicleData(resp);

            // Emmit New Detect Car
            emitEventToClients(
                'getVehicleLegalStatusDetailInfoByPlate',
                {
                    "car_plate": recog_number,
                    "kashif_resp": resp
                }
            );

            // Emmit Kashif Error Message To Clients
            if (_.get(resp, 'code') !== '000') {
                emitEventToClients(
                    'kashifErrorHappened',
                    {
                        "error": `plate ${recog_number} Error:  ${_.get(resp, 'message')}`,
                    }
                );
            }

        }).catch((e) => {
            console.log(e);
            let resp = {};
            resp['code'] = 'xxx';
            resp['message'] = 'kashif endpoint request error';
            resp['plate_number'] = recog_number;
            resp['plate_type'] = plateInfo['plateType'];
            resp['lpr_id'] = lpr_id;
            resp['camera_id'] = camera_id;
            resp['date'] = moment(date, "DD-MM-YY").format('YYYY-MM-DD');
            resp['time'] = time;
            // Store Un Detected Car To Database Asynchronously
            storeVehicleData(resp);
            // Emmit New Detect Car
            emitEventToClients(
                'kashifErrorHappened',
                {
                    "error": `
Plate ${recog_number} 
Error:  Unable to connect to kashif
                    `,
                }
            );
        });
    }

});


function runServer() {
// Start the server
    server.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

runServer();

