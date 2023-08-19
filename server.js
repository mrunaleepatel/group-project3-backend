////////////////////////////
// IMPORT OUR DEPENDENCIES
////////////////////////////
// Read .env file and create environmental variables
require("dotenv").config();

// Pull PORT from .env, give default value
const { PORT = 4500, DATABASE_URL } = process.env

// Import Express
const express = require("express");

// Express application object
const app = express();

// Import mongoose
const mongoose = require("mongoose");

// Import cords
const cors = require("cors");

// Import morgan
const morgan = require("morgan");


/////////////////////////////////
// DATABASE CONNECTION
/////////////////////////////////

// Establish connection
mongoose.connect(DATABASE_URL)


// Connection Events
mongoose.connection
.on("open", () => console.log("Connected to mongoose"))
.on("close", () => console.log("Disconnected from mongoose"))
.on("error", (error) => console.log(error))

/////////////////////////////////
// MODEL
/////////////////////////////////
const placeSchema = new mongoose.Schema({
    name: String,
    country: String,
    type: String,
    image: String,
    url: String,
    description: String,
    seasonToGo: String,
    visited: Boolean
})
const Place = mongoose.model("Place", placeSchema)


/////////////////////////////////
// MIDDLEWARE
/////////////////////////////////
// cors for preventing cors errors
app.use(cors())

// morgan for logging requests
app.use(morgan("dev"))

// express functionality to recognize incoming request objects as JSON objects
app.use(express.json())


////////////////////////////
// ROUTES
////////////////////////////
// create a test route
app.get("/", (req, res) => {
    res.json({hello: "world"})
})










////////////////////////////
// LISTENER
////////////////////////////
app.listen(PORT, () => console.log(`Listening on port ${PORT}`))