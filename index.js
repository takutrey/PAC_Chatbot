require("dotenv").config(); 
const { default: axios } = require("axios");
const bodyParser = require("body-parser");
const express = require('express');
const router = require("./routes/routes");

const app = express(); 

app.use(bodyParser.json());
app.use(router);




app.listen(process.env.APP_PORT, () =>{
    console.log(`Server running on port ${process.env.APP_PORT}`);
});