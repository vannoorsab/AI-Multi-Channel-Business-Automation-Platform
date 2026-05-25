const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.post("/webhook", (req, res) => {

    const incomingMessage = req.body.Body;

    console.log("User Message:", incomingMessage);

    const twiml = new twilio.twiml.MessagingResponse();

    twiml.message("Hello from AI Bot");

    res.writeHead(200, { "Content-Type": "text/xml" });

    res.end(twiml.toString());

});

app.listen(5000, () => {
    console.log("Server Running on Port 5000");
});
