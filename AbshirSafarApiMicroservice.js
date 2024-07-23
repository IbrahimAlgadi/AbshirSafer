const axios = require('axios');
const uuid = require('uuid');
const securos = require("securos");
// jose
const { generateKeyPair, exportJWK, importJWK, EncryptJWT, jwtDecrypt, SignJWT, jwtVerify } = require('jose');
const fs = require('fs');
const path = require('path');


// Algorithms
const JWE_ALGORITHM = 'RSA-OAEP';
const JWE_ENCRYPTION_ALGORITHM = 'A256CBC-HS512';
const JWS_ALGORITHM = 'RS256';


API_OBJECT_TYPE = "ABSHIR_API";
API_OBJECT_ID = "1";


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

    // Generate RSA Key Pair
    async generateRSAKeyPair(algorithm, keyPath) {
        const { publicKey, privateKey } = await generateKeyPair(algorithm, { modulusLength: 2048 });
        // console.log("-------------------");
        // console.log("Public Key: \n", JSON.stringify(publicKey));
        // console.log("-------------------");
        // console.log("Private Key: \n", JSON.stringify(privateKey));
        // console.log("-------------------");
        const exportedPublicKey = await exportJWK(publicKey);
        const exportedPrivateKey = await exportJWK(privateKey);

        // Save the keys to files
        fs.writeFileSync(path.join(__dirname, `${keyPath}_public_key.json`), JSON.stringify(exportedPublicKey));
        fs.writeFileSync(path.join(__dirname, `${keyPath}_private_key.json`), JSON.stringify(exportedPrivateKey));
    };

    // Encrypt a Payload
    async encryptPayload(payload, publicKeyPath) {
        const publicKey = JSON.parse(fs.readFileSync(path.join(__dirname, `${publicKeyPath}_public_key.json`), 'utf8'));
        const importedPublicKey = await importJWK(publicKey, JWE_ALGORITHM);

        const encryptedJWT = await new EncryptJWT(payload)
            .setProtectedHeader({ alg: JWE_ALGORITHM, enc: JWE_ENCRYPTION_ALGORITHM })
            .setIssuedAt()
            .setExpirationTime('2h')
            .encrypt(importedPublicKey);

        console.log("-------------------");
        console.log("encryptedJWT: \n", encryptedJWT)
        console.log("-------------------");

        return encryptedJWT;
    };

    // Decrypt the Payload
    async decryptPayload(encryptedJWT, privateKeyPath) {
        const privateKey = JSON.parse(fs.readFileSync(path.join(__dirname, `${privateKeyPath}_private_key.json`), 'utf8'));
        const importedPrivateKey = await importJWK(privateKey, JWE_ALGORITHM);

        const { payload, protectedHeader } = await jwtDecrypt(encryptedJWT, importedPrivateKey);

        console.log("-------------------");
        console.log("decryptPayload payload: \n", payload)
        console.log("-------------------");

        console.log("-------------------");
        console.log("decryptPayload protectedHeader: \n", protectedHeader)
        console.log("-------------------");

        return { payload, protectedHeader };
    };

    // Sign the Payload
    async signPayload(payload, privateKeyPath) {
        const privateKey = JSON.parse(fs.readFileSync(path.join(__dirname, `${privateKeyPath}_private_key.json`), 'utf8'));
        const importedPrivateKey = await importJWK(privateKey, JWS_ALGORITHM);

        const signedJWT = await new SignJWT(payload)
            .setProtectedHeader({ alg: JWS_ALGORITHM })
            .setIssuedAt()
            .setExpirationTime('2h')
            .sign(importedPrivateKey);

        console.log("-------------------");
        console.log("signPayload signedJWT: \n", signedJWT)
        console.log("-------------------");

        return signedJWT;
    };

    // Verify the Signed Payload
    async verifySignedPayload (signedJWT, publicKeyPath) {
        const publicKey = JSON.parse(fs.readFileSync(path.join(__dirname, `${publicKeyPath}_public_key.json`), 'utf8'));
        const importedPublicKey = await importJWK(publicKey, JWS_ALGORITHM);

        const { payload, protectedHeader } = await jwtVerify(signedJWT, importedPublicKey);
        
        console.log("-------------------");
        console.log("verifiedPayload payload: \n", payload)
        console.log("-------------------");
        
        console.log("-------------------");
        console.log("verifiedPayload protectedHeader: \n", protectedHeader)
        console.log("-------------------");

        return { payload, protectedHeader };
    };

    async getTravelRequest(transactionId) {
        // verify the required parameter 'clientId' is set
        if (!transactionId) 
            throw new Error("Missing the required parameter 'transactionId' when calling getTravelRequest");

        try {
            const endPoint = `/TravelRequests?transactionIdFilter=${transactionId}`;
            // Send the POST request using the configured instance
            const response = await this.apiInstance.get(endPoint);
            return {
                "status": response.status,
                "data": response.data
            };
        } catch (error) {
            // console.log(error);
            const apiError = handleApiError(error);
            throw apiError;
        }
    }

    async verifyTravelRequest(travelRequest) {
        if (!travelRequest) 
            throw new Error("Missing the required parameter 'travelRequest' when calling verifyTravelRequest");

        try {
            // // const encryptedPayload = await this.encryptPayload(travelRequest);
            // // console.log(encryptedPayload);

            // // Client encrypts the request using Absher's public key
            // const encryptedJWT = await this.encryptPayload(travelRequest, 'absher_encryption');
            // // console.log('Encrypted JWT:', encryptedJWT);

            // // Client signs the encrypted content using client's private key
            // const signedJWT = await this.signPayload({ encryptedJWT }, 'client_signing');
            // // console.log('Signed JWT:', signedJWT);

            // // Absher verifies the signed JWT using client's public key
            // const verifiedPayload = await this.verifySignedPayload(signedJWT, 'client_signing');
            // // console.log('Verified Payload:', verifiedPayload);

            // // Absher decrypts the verified encrypted payload using Absher's private key
            // const decryptedPayload = await this.decryptPayload(verifiedPayload.payload.encryptedJWT, 'absher_encryption');
            // // console.log('Decrypted Payload:', decryptedPayload);

            const endPoint = `/TravelRequests`;
            // Send the POST request using the configured instance
            const response = await this.apiInstance.patch(endPoint, travelRequest);

            return {
                "status": response.status,
                "data": response.data
            };
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


console.log('\r\n');
securos.connect(async (core) => {
    
    // await api.generateRSAKeyPair(JWE_ALGORITHM, 'absher_encryption');
    // await api.generateRSAKeyPair(JWS_ALGORITHM, 'client_signing');

    const TRANSACTION_ID = uuid.v1();

    /// console.log("----------------------");
    // Get travel request
    // api.getTravelRequest(TRANSACTION_ID)
    //     .then(data => console.log('Travel Request Data:\n', data))
    //     .catch(error => console.error('Error fetching travel request:\n', error));

    // console.log(core.selfType, core.selfId);
    core.registerEventHandler(API_OBJECT_TYPE, API_OBJECT_ID, "VERIFY_TRAVEL_REQUEST", (e) => {
        let RETURN_EVENT_UUID = e.params.return_uuid;
        let RETURN_EVENT = e.params.return_event;
        let travelRequest = {};
        console.log(API_OBJECT_TYPE, API_OBJECT_ID, "VERIFY_TRAVEL_REQUEST", RETURN_EVENT_UUID, RETURN_EVENT);
        // Verify travel request
        travelRequest = {
            action: VehicleRegistrationTypeModel.TRAVEL_REQUEST,
            vehicleRegistrationType: VehicleRegistrationTypeModel.PRIVATE,
            vehiclePlateNumber: 'ه ح ح 123',
            providerReferenceNumber: 'ABC-123-xyz',
            hasTowingTrailer: true,
            transactionId: TRANSACTION_ID
        };

        // console.log("----------------------");
        // Verify Travel Request
        api.verifyTravelRequest(travelRequest)
            .then(data => {
                // console.log(API_OBJECT_TYPE, RETURN_EVENT_UUID, RETURN_EVENT, travelRequest);
                core.sendEvent(API_OBJECT_TYPE, RETURN_EVENT_UUID, RETURN_EVENT, {
                    "api": JSON.stringify({
                        "result": data,
                        "success": true
                    })
                })
            })
            .catch(error => {
                console.error('Error verifying travel request:\n', error);
                core.sendEvent(API_OBJECT_TYPE, RETURN_EVENT_UUID, RETURN_EVENT, {
                    "api": JSON.stringify({
                        "result": error,
                        "success": false
                    })
                })
            });

    })

})

