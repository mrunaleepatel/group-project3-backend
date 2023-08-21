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

const cookieParser = require("cookie-parser");
// import bcrypt  
const bcrypt = require("bcryptjs")
// import jwt
const jwt = require("jsonwebtoken")


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
// MODELS
/////////////////////////////////

// User Model \\

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: {type: String, required: true},
  });
  
const User = mongoose.model("User", UserSchema);

const placeSchema = new mongoose.Schema({
    name: String,
    country: String,
    type: String,
    image: String,
    url: String,
    notes: String,
    seasonToGo: String,
    visited: Boolean,
    username: String
})

const Places = mongoose.model("Places", placeSchema)
////////////////////////////////
// Custome Middleware Auth
////////////////////////////////
async function authCheck(req, res, next){
    // check if the request has a cookie
    if(req.cookies.token){
      // if there is a cookie, try to decode it
      const payload = await jwt.verify(req.cookies.token, process.env.SECRET)
      // store the payload in the request
      req.payload = payload;
      // move on to the next piece of middleware
      next();
    } else {
      // if there is no cookie, return error
      res.status(400).json({ error: "You are not authorized" });
    }
  }


/////////////////////////////////
// MIDDLEWARE
/////////////////////////////////
// cors for preventing cors errors
app.use(
    cors({
      origin: "*",
      credentials: true,
    })
  );
// cookie parser
app.use(cookieParser());
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

// INDEX - GET - ALL PLACES
app.get("/places", authCheck, async (req, res) => {
    try {
        const places = await Places.find({username: req.payload.username});
        res.json(places);
} catch (err) {
    res.status(400).json({err});
}
});



// CREATE - POST - NEW PLACE
app.post("/places", authCheck, async (req, res) => {
    try {
        req.body.username = req.payload.username;
        const place = await Places.create(req.body)
        res.json(place)
    }
    catch(error){
        res.status(400).json({ error })
    }
})

// SHOW - GET - SINGLE PLACE
app.get("/places/:id", authCheck, async (req, res) => {
    try {
      const place = await Places.findById(req.params.id);
      res.json(place);
    } catch (error) {
      res.status(400).json({ error });
    }
});


// UPDATE - PUT - SINGLE PLACE

app.put("/places/:id", authCheck, async (req, res) => {
    try {
        const place = await Places.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        })
        res.json(place)
    } catch (error) {
        res.status(400).json({error})
    }
})


// DELETE - DELETE - SINGLE PLACE
app.delete("/places/:id", authCheck, async (req, res) => {
    try {
      
      const place = await Places.findByIdAndDelete(req.params.id);
      
      res.status(204).json(place);
    } catch (error) {
      res.status(400).json({ error });
    }
});

////////////////////////////
// AUTH Routes
////////////////////////////
app.post("/signup", async (req, res) => {
    try {
      // deconstruct the username and password from the body
      let { username, password } = req.body;
      // hash the password
      password = await bcrypt.hash(password, await bcrypt.genSalt(10));
      // create a new user in the database
      const user = await User.create({ username, password });
      // send the new user as json
      res.json(user);
    } catch(error){
      res.status(400).json({error})
    }
  })

 app.post("/login", async (req, res) => {
    try {
      // deconstruct the username and password from the body
      const { username, password } = req.body;
      // search the database for a user with the provided username
      const user = await User.findOne({ username });
      // if no user is found, return an error
      if (!user) {
        throw new Error("No user with that username found");
      }
      // if a user is found, let's compare the provided password with the password on the user object
    
      const passwordCheck = await bcrypt.compare(password, user.password);
      // if the passwords don't match, return an error
      if (!passwordCheck) {
        throw new Error("Password does not match");
      }
      // create a token with the username in the payload
      const token = jwt.sign({ username: user.username }, process.env.SECRET);
      // send a response with a cooke that includes the token
      res.cookie("token", token, {
        // can only be accessed by server requests
        httpOnly: true,
        // path = where the cookie is valid
        path: "/",
        // domain = what domain the cookie is valid on
        domain: "localhost",
        // secure = only send cookie over https
        secure: false,
        // sameSite = only send cookie if the request is coming from the same origin
        sameSite: "lax", // "strict" | "lax" | "none" (secure must be true)
        // maxAge = how long the cookie is valid for in milliseconds
        maxAge: 3600000, // 1 hour
      });
      // send the user as json
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // get /cookietest to test our cookie
app.get("/cookietest", (req, res) => {
    res.json(req.cookies);
  })

app.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "You have been logged out" });
  })

////////////////////////////
// LISTENER
////////////////////////////
app.listen(PORT, () => console.log(`Listening on port ${PORT}`))