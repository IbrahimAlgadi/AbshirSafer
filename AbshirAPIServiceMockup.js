const express = require("express");

const app = express();
app.use(express.json());
let toggle = true;

app.get('/TravelRequests', async (req, res) => {
    try {
        // console.log(req.headers);
        // console.log(req.query);
        // console.log(req.body);
        const transactionIdFilter = req.query.transactionIdFilter;
        console.log("[*] Recived transactionIdFilter: ", transactionIdFilter);
        // Response 1
        /**
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
         */

        res.status(403).json({});

        // res.json({
        //     "travelRequestSummaryModelList": [
        //         {
        //             "vehicleRegistrationType": "PRIVATE",
        //             "vehiclePlateNumber": "ه ح ح 123",
        //             "transactionId": "8c858e60-3ef7-4499-b67b-a6b714063e57",
        //             "verificationDateTime": "31/12/2017 23:59:59",
        //             "verificationtype": "TRAVEL_REQUEST"
        //         }
        //     ]
        // });

        // res.status(400).json({
        //     "errorModelList": [
        //         {
        //         "errorCategory": "ECXXXX00",
        //         "errorCode": "EXXXX000",
        //         "errorFieldList": [
        //             "$.vehiclePlateNumber"
        //         ],
        //         "errorMessage": {
        //             "en-US": "English Value",
        //             "ar-SA": "Arabic Value"
        //         }
        //         }
        //     ]
        // });
    } catch (error) {
        res.status(500).json({
            "errorModelList": [
                {
                "errorCategory": "ECXXXX00",
                "errorCode": "EXXXX000",
                "errorFieldList": [
                    "$.vehiclePlateNumber"
                ],
                "errorMessage": {
                    "en-US": "English Value",
                    "ar-SA": "Arabic Value"
                }
                }
            ]
        });
    }
});

app.patch('/TravelRequests', async (req, res) => {
    try {
        // console.log(req.headers);
        // console.log(req.body);
        if (toggle) {
            res.status(200).json({});
        } else {
            res.status(403).json({});
        }
        toggle = !toggle;
        // res.status(403).json({});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});