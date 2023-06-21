require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/usersDB", {useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => {
    console.log("Mongoose connected!");
    })
  .catch(err => {
    console.error("Error:", err);
    process.exit(1); // Terminate the process with an error code
  });

const userSchema =  new mongoose.Schema ({
    email: String,
    password: String
});

userSchema.plugin(encrypt, {secret: process.env.MYSECRET, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);

app.get("/" , function(req, res) {
    res.render("home");
});

app.get("/login" , function(req, res) {
    res.render("login");    
});

app.get("/register" , function(req, res) {
    res.render("register");
});

app.post("/register", async function(req, res) {
  const userData = {
    email: req.body.username,
    password: req.body.password
  };

  const newUser = new User(userData);
  
  try {
    await newUser.save();
    res.render("secrets");
    console.log("Registration successful.")
  } catch (err) {
    console.log(err);
    console.log("Registration unsuccessful!");
  }
});

app.post("/login", async function(req, res) {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const foundUser = await User.findOne({ email: email });
    if (foundUser && foundUser.password === password) {
      console.log("Login successful.");
      res.render("secrets");
    }else{
      console.log("Login unsuccessful.")
    }
  } catch (err) {
    console.log(err);
  }
});


app.listen(3000, function(){
    console.log("Started listening at port 3000.");
});
