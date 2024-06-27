const express = require("express");

const app = express();
app.use(express.json());

app.get('/TravelRequests', async (req, res) => {
    try {
        console.log(req.headers);
        console.log(req.body);
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

        res.json({
            "travelRequestSummaryModelList": [
                {
                    "vehicleRegistrationType": "PRIVATE",
                    "vehiclePlateNumber": "ه ح ح 123",
                    "transactionId": "8c858e60-3ef7-4499-b67b-a6b714063e57",
                    "verificationDateTime": "31/12/2017 23:59:59",
                    "verificationtype": "TRAVEL_REQUEST"
                }
            ]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/TravelRequests', async (req, res) => {
    try {
        res.json({
            "res": "Done"
        })
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});