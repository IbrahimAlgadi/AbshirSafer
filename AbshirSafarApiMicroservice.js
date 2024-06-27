const axios = require('axios');
const uuid = require('uuid');

VehicleRegistrationTypeModel = {
    PRIVATE: "PRIVATE",
    PRIVATE_TRANSPORT: "PRIVATE_TRANSPORT"
};

VerificationTypeModel = {
    TRAVEL_REQUEST: "TRAVEL_REQUEST",
    TOLL_FEE: "TOLL_FEE",
    INSURANCE: "INSURANCE"
};


// Error handling function
const handleApiError = (error) => {
    if (!error.response) {
        return {
            status: "000",
            message: error.message,
            data: {}
        };
    }

    const status = error.response.status;
    let message;

    switch (status) {
        case 200:
            message = "The request has been successfully processed.";
            break;
        case 400:
            message = "The request was rejected by the server due to malformed syntax. Bad Request.";
            break;
        case 401:
            message = "The request requires user authentication. If the request already included Authorization credentials, then the 401 response indicates that authorization has been refused for those credentials.";
            break;
        case 403:
            message = "The server understood the request, but The Vehicle is not authorized to open the Gate.";
            break;
        case 404:
            message = "The server has not found anything matching the Request-URI.";
            break;
        case 409:
            message = "The request could not be completed due to a conflict with the current state of the resource. Usually business validation errors will be returned in the body.";
            break;
        case 429:
            message = "Too many requests.";
            break;
        case 500:
            message = "The server encountered an unexpected condition which prevented it from fulfilling the request.";
            break;
        case 501:
            message = "The server does not support the functionality required to fulfill the request.";
            break;
        case 503:
            message = "The server is currently unable to handle the request due to unavailability of external dependency.";
            break;
        case 500:
            message = "The server encountered an unexpected condition which prevented it from fulfilling the request.";
            break;
        default:
            message = error.message;
            break;
    }

    return {
        status,
        message,
        data: error.response ? error.response.data : {},
    };
};

class AbsherSafarAPI {
    /**
     * 
     * Consume APIs to check whether car passengers are verified and authorized to pass through a lane gate. 
     * The API is called after security camera recognition for the plate number. 
     * It verifies whether the travelers have completed all necessary verification steps.
     * 
     * When the response is 200 then the vehicle can access the gate, when the response other than that, 
     * then the vehicle is not allowed to do so.
     * 
     * @param {String} baseURL API base URL that can be configured to access the service
     * @param {String} clientId Client id issued by security server
     * @param {String} clientSecret ClientSecret issued by security server
     * @param {String} acceptLanguage The language localization to be used on the response
     * @param {String} userAgent The string that allows the network protocol peers to identify the application type, 
     * operating system, software vendor or software version of the requesting software user agent
     * @param {String} clientNonce Unique request id
     * 
     */

    constructor(baseURL, clientId, clientSecret, acceptLanguage, userAgent, clientNonce) {

        // verify the required parameter 'clientId' is set
        if (!clientId)
            throw new Error("Missing the required parameter 'clientId' when calling AbsherSafarAPI");
        
        // verify the required parameter 'clientSecret' is set
        if (!clientSecret)
            throw new Error("Missing the required parameter 'clientSecret' when calling AbsherSafarAPI");
        
        // verify the required parameter 'clientNonce' is set
        if (!clientNonce)
            throw new Error("Missing the required parameter 'clientNonce' when calling AbsherSafarAPI");
        
        // verify the required parameter 'acceptLanguage' is set
        if (!acceptLanguage)
            throw new Error("Missing the required parameter 'acceptLanguage' when calling AbsherSafarAPI");
        
        // verify the required parameter 'userAgent' is set
        if (!userAgent)
            throw new Error("Missing the required parameter 'userAgent' when calling AbsherSafarAPI");

        this.baseURL = baseURL;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.acceptLanguage = acceptLanguage;
        this.userAgent = userAgent;
        this.clientNonce = clientNonce;

        const headers = {
            'ClientId': this.clientId,
            'ClientSecret': this.clientSecret,
            'Accept-Language': this.acceptLanguage,
            'User-Agent': this.userAgent,
            'ClientNonce': this.clientNonce
        };

        // Create an Axios instance with preconfigured headers and root URL
        this.apiInstance = axios.create({
            baseURL: this.baseURL, // Replace with your actual root URL
            headers
        });

    }

    async getTravelRequest(transactionId) {
        /**
         * 
         * Return the details of Travel request verification based on provided TransactionId
         * 
         * @param {String} transactionId This should be the uinque id that should saved on absher 
         * to do the correlation between absher and every request comes from the clients
         * Transaction Id used by the client to verify travel request
         * 
         * 
{
  "travelRequestSummaryModelList": [
    {
      "vehicleRegistrationType": "PRIVATE",
      "vehiclePlateNumber": "ه ح ح 123",
      "transactionId": "8c858e60-3ef7-4499-b67b-a6b714063e57",
      "verificationDateTime": "31/12/2017 23:59:59",
      "verificationtype": "TRAVEL_REQUEST"
    }
  ]
}
         *
         *
         */

        // verify the required parameter 'transactionId' is set
        if (!transactionId) 
            throw new Error("Missing the required parameter 'transactionId' when calling getTravelRequest");

        try {
            const endPoint = `/TravelRequests?transactionIdFilter=${transactionId}`;
            // Send the POST request using the configured instance
            const response = await this.apiInstance.get(endPoint);
            return response.data;
        } catch (error) {
            // console.log(error);
            const apiError = handleApiError(error);
            throw apiError;
        }
    }

    async verifyTravelRequest(travelRequest) {
        /**
         * Validation on vehicle to be able to open the gate
         * 
         * @param {Object} travelRequest This is the request body as the following
{
  "action": "VERIFY_TRAVEL_REQUEST",
  "vehicleRegistrationType": "PRIVATE",
  "vehiclePlateNumber": "ه ح ح 123",
  "providerReferenceNumber": "ABC-123-xyz",
  "hasTowingTrailer": true,
  "transactionId": "8c858e60-3ef7-4499-b67b-a6b714063e57"
}
         * 200	The request has been successfully processed.
         * 403  The server understood the request, but The Vehicle is not authorized to open the Gate.
         * 
         * 
         * 
         * 
         */
        if (!travelRequest) 
            throw new Error("Missing the required parameter 'travelRequest' when calling verifyTravelRequest");
        
        if (!Object.values(VehicleRegistrationTypeModel).includes(travelRequest.vehicleRegistrationType))
            throw new Error("Invalid vehicle registration type");
    
        if (!Object.values(VerificationTypeModel).includes(travelRequest.verificationType)) 
            throw new Error("Invalid verification type");

        try {
            const endPoint = `/TravelRequests`;
            // Send the POST request using the configured instance
            const response = await this.apiInstance.patch(endPoint, travelRequest);
            return response.data;
        } catch (error) {
            // console.log(error);
            const apiError = handleApiError(error);
            throw apiError;
        }
    }
}

// Usage example
const api = new AbsherSafarAPI(
    baseURL = 'http://localhost:3000',
    clientId = 'your-client-id',
    clientSecret = 'your-client-secret',
    acceptLanguage = 'ar-SA',
    userAgent = 'your-user-agent',
    clientNonce = 'your-client-nonce'
);

const TRANSACTION_ID = uuid.v1();

console.log('\r\n');
// console.log("----------------------");
// Verify travel request
const travelRequest = {
    action: VerificationTypeModel.TRAVEL_REQUEST,
    vehicleRegistrationType: VehicleRegistrationTypeModel.PRIVATE,
    vehiclePlateNumber: 'ه ح ح 123',
    providerReferenceNumber: 'ABC-123-xyz',
    hasTowingTrailer: true,
    transactionId: TRANSACTION_ID
};
// Verify Travel Request
api.verifyTravelRequest(travelRequest)
    .then(data => console.log('Verification Response:\n', data))
    .catch(error => console.error('Error verifying travel request:\n', error));

// TODO: Create Database Travel Request
// lpr_id
// lpr_name
// cam_id
// cam_name
// plate_number
// action (TRAVEL_REQUEST, TOLL_FEE, INSURANCE)
// vehicle_registration_type (PRIVATE, PRIVATE_TRANSPORT)
// vehicle_plate_number (string)
// provider_reference_number (string)
// has_towing_trailer (true, false)
// transaction_id uuid
// request_date (DATE)
// request_time (TIME)
// open_barrier (ALLOW=true, DENY=false)

// console.log("----------------------");
// Get travel request
api.getTravelRequest(TRANSACTION_ID)
    .then(data => console.log('Travel Request Data:\n', data))
    .catch(error => console.error('Error fetching travel request:\n', error));
