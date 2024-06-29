const { Pool } = require('pg');
const securos = require('securos');

// Variables
let SECUROS_CORE = null;
let DB_API_OBJECT_TYPE = 'ABSHIR_DB';
let API_OBJECT_ID = "DB1";
// Database
const DB_USER = "postgres";
const DB_PASSWORD = "postgres";
const DB_HOST = "localhost";
const DB_POSTGRES = "postgres";
const DB_APP = "vehicle_travel_request_db";


// Databases
const pool = new Pool({
    user: DB_USER,
    host: DB_HOST,
    database: DB_APP,
    port: 5432,
    password: DB_PASSWORD
});

/**
 -- Create request_source Table
CREATE TABLE request_source (
    id SERIAL PRIMARY KEY,
    lpr_id VARCHAR(128),
    lpr_name VARCHAR(255),
    cam_id VARCHAR(128),
    cam_name VARCHAR(255)
);

-- Create travel_request Table
CREATE TABLE travel_request (
    id SERIAL PRIMARY KEY,
    request_source_id INTEGER,
    full_plate_number VARCHAR,
    action VARCHAR,
    vehicle_registration_type VARCHAR,
    vehicle_plate_number VARCHAR,
    provider_reference_number VARCHAR,
    has_towing_trailer BOOL,
    transaction_id VARCHAR,
    request_date DATE NOT NULL,
    request_time TIME NOT NULL,
    request_status VARCHAR,
    open_gate BOOL,
    FOREIGN KEY (request_source_id) REFERENCES request_source(id)
);
 */

class AppDatabase {
    DB_USER = "postgres";
    DB_PASSWORD = "postgres";
    DB_HOST = "localhost";
    DB_POSTGRES = "postgres";
    DB_APP = "vehicle_travel_request_db";

    async insertRequestSourceTravelRequest(requestSource, travelRequest) {
        // console.log(requestSource, travelRequest);
        const client = await pool.connect();
        let res;

        await client.query('BEGIN');

        try {

            const requestSourceQuery = `
            INSERT INTO request_source (
                lpr_id, 
                lpr_name,
                cam_id,
                cam_name
            ) VALUES (
                $1,
                $2,
                $3,
                $4     
            ) ON CONFLICT (lpr_id) DO UPDATE SET
                lpr_name = $2,
                cam_name = $4
            RETURNING 
                id,
                lpr_id, 
                lpr_name,
                cam_id,
                cam_name;
            `;
            res = await client.query(
                requestSourceQuery, 
                [
                    requestSource.lpr_id,
                    requestSource.lpr_name,
                    requestSource.cam_id,
                    requestSource.cam_name,
                ]
            );

            let requestSourceObj = res.rows[0];
            // console.log(requestSourceObj);
            let request_source_id = requestSourceObj.id;
            
            const query = `
            INSERT INTO travel_request (
                request_source_id, 
                full_plate_number,
                action,
                vehicle_registration_type,
                vehicle_plate_number,
                provider_reference_number,
                has_towing_trailer,
                transaction_id,
                request_date,
                request_time,
                request_status,
                open_gate
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
                $12   
            ) RETURNING (
                id, 
                request_source_id, 
                full_plate_number,
                action,
                vehicle_registration_type,
                vehicle_plate_number,
                provider_reference_number,
                has_towing_trailer,
                transaction_id,
                request_date,
                request_time,
                request_status,
                open_gate
            );
            `;
            res = await client.query(
                query, 
                [
                    request_source_id,
                    travelRequest.full_plate_number,
                    travelRequest.action,
                    travelRequest.vehicle_registration_type,
                    travelRequest.vehicle_plate_number,
                    travelRequest.provider_reference_number,
                    travelRequest.has_towing_trailer,
                    travelRequest.transaction_id,
                    travelRequest.request_date,
                    travelRequest.request_time,
                    travelRequest.request_status,
                    travelRequest.open_gate,
                ]
            );
            let travelRequestObject = res.rows[0];
            await client.query('COMMIT');
            return {
                requestSourceObj,
                travelRequestObject
            }
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }    

    async getAllData(pageSize, pageNumber, searchParams, dateRange) {
        const client = await pool.connect();
        let query = `
            SELECT 
                rs.lpr_id, 
                rs.lpr_name,
                rs.cam_id,
                rs.cam_name,
                tr.request_source_id,
                tr.id, 
                tr.full_plate_number,
                tr.action,
                tr.vehicle_registration_type,
                tr.vehicle_plate_number,
                tr.provider_reference_number,
                tr.has_towing_trailer,
                tr.transaction_id,
                tr.request_date,
                tr.request_time,
                tr.request_status,
                tr.open_gate
            FROM 
                travel_request tr
            LEFT JOIN 
                request_source rs ON tr.request_source_id = rs.id
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        // Add search parameters
        if (searchParams) {
            for (const [key, value] of Object.entries(searchParams)) {
                if (value) {
                    query += ` AND ${key} ILIKE $${paramIndex}`;
                    params.push(`%${value}%`);
                    paramIndex++;
                }
            }
        }

        // Add date range filter
        if (dateRange) {
            if (dateRange.startDate) {
                query += ` AND (tr.request_date + tr.request_time) >= TO_TIMESTAMP($${paramIndex}, 'YYYY-MM-DD HH24:MI:SS') `;
                params.push(dateRange.startDate);
                paramIndex++;
            }
            if (dateRange.endDate) {
                // query += ` AND tr.request_date <= $${paramIndex}`;
                query += ` AND (tr.request_date + tr.request_time) <= TO_TIMESTAMP($${paramIndex}, 'YYYY-MM-DD HH24:MI:SS') `;
                params.push(dateRange.endDate);
                paramIndex++;
            }
        }

        // Add pagination
        query += ` ORDER BY tr.id DESC`;
        // query += ` ORDER BY tr.id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        // params.push(pageSize, pageSize * (pageNumber - 1));
        console.log(query);

        const result = await client.query(query, params);
        
        client.release();
        // if result.rows
        return result.rows;
    }

}


console.log("\r\n");

securos.connect(async (core) => {
    console.log("[*] Database Microservice Started: ");
    console.log("[*] DB_API_OBJECT_TYPE = " + DB_API_OBJECT_TYPE);
    console.log("[*] API_OBJECT_ID = " + API_OBJECT_ID);

    SECUROS_CORE = core;

    let appDb = new AppDatabase();
    
    
    core.registerEventHandler(DB_API_OBJECT_TYPE, API_OBJECT_ID, "insertRequestSourceTravelRequest", (e) => {
        // console.log(e);
        let param = JSON.parse(e.params.param);
        let requestSource = param.requestSource;
        let travelRequest = param.travelRequest;
        let RETURN_EVENT_UUID = e.params.return_uuid;
        let RETURN_EVENT = e.params.return_event;
        // console.log(DB_API_OBJECT_TYPE, API_OBJECT_ID, "insertRequestSourceTravelRequest", RETURN_EVENT_UUID, RETURN_EVENT);

        // Insert Into Database
        appDb
            .insertRequestSourceTravelRequest(requestSource, travelRequest)
            .then(data => {
                // console.log(DB_API_OBJECT_TYPE, RETURN_EVENT_UUID, RETURN_EVENT, travelRequest);
                core.sendEvent(DB_API_OBJECT_TYPE, RETURN_EVENT_UUID, RETURN_EVENT, {
                    "api": JSON.stringify({"result": data, success: true})
                })
            })
            .catch(error => {
                console.error('Insert To Database Error:\n', error);
                core.sendEvent(DB_API_OBJECT_TYPE, RETURN_EVENT_UUID, RETURN_EVENT, {
                    "api": JSON.stringify({"result": error, success: false})
                })
            });

    });

    core.registerEventHandler(DB_API_OBJECT_TYPE, API_OBJECT_ID, "getAllData", (e) => {
        // console.log(e);
        let param = JSON.parse(e.params.param);
        console.log(param);
        // Pagination options
        let pageSize = param.pageSize || 10;
        let pageNumber = param.pageNumber || 1;
        // Filtering with db fields
        let searchParams = param.searchParams || {};
        // Filtering with date range 
        let dateRange = param.dateRange || {};

        let RETURN_EVENT_UUID = e.params.return_uuid;
        let RETURN_EVENT = e.params.return_event;
        console.log(DB_API_OBJECT_TYPE, API_OBJECT_ID, "getAllData", RETURN_EVENT_UUID, RETURN_EVENT);

        // Insert Into Database
        appDb
            .getAllData(pageSize, pageNumber, searchParams, dateRange)
            .then(data => {
                // console.log(data);
                console.log(DB_API_OBJECT_TYPE, RETURN_EVENT_UUID, RETURN_EVENT);
                core.sendEvent(DB_API_OBJECT_TYPE, RETURN_EVENT_UUID, RETURN_EVENT, {
                    "api": JSON.stringify({"result": data, success: true})
                })
            })
            .catch(error => {
                console.error('getAllData Error:\n', error);
                core.sendEvent(DB_API_OBJECT_TYPE, RETURN_EVENT_UUID, RETURN_EVENT, {
                    "api": JSON.stringify({"result": error, success: false})
                })
            });

    });

})