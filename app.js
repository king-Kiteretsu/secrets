require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");

const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const LocalStrategy = require('passport-local').Strategy;


// const md5 =  require("md5");
// const encrypt = require("mongoose-encryption");
// const bcrypt = require("bcrypt");
// const saltRounds = 9;


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: "secret key they say",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());



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

// mongoose.set("useCreateIndex", true); why did i place it here?

userSchema.plugin(passportLocalMongoose);

// userSchema.plugin(encrypt, {secret: process.env.MYSECRET, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);

passport.use(new LocalStrategy(User.authenticate()));

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id)
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err, null);
    });
});




app.get("/" , function(req, res) {
    res.render("home");
});

app.get("/login" , function(req, res) {
    res.render("login");    
});

app.get("/register" , function(req, res) {
    res.render("register");
});

app.get("/secrets", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function(req, res) {
  req.logout(function(err) {
    if (err) {
      console.log(err);
    }
    res.redirect("/");
  });
});

app.post("/register", async function(req, res) {
  const username = req.body.username;
  const password = req.body.password;

  try {
    // Check if the username already exists
    const foundUser = await User.findOne({ username: username });
    if (foundUser) {
      console.log("User with the given username already exists.");
      res.redirect("/register");
    } else {
      // Create a new user
      const newUser = new User({ username: username });
      await User.register(newUser, password);
      
      // Authenticate and redirect to secrets page
      passport.authenticate("local")(req, res, function() {
        console.log("Registration successful.");
        res.redirect("/secrets");
      });
    }
  } catch (err) {
    console.log(err);
    console.log("Error occurred during registration.");
    res.redirect("/register");
  }

  // bcrypt.hash(req.body.password, saltRounds,async function(err, hash) {
    
  //     const userData = {
  //       email: req.body.username,
  //       password: hash
  //     };
    
  //     const newUser = new User(userData);
      
  //     try {
  //       await newUser.save();
  //       res.render("secrets");
  //       console.log("Registration successful.")
  //     } catch (err) {
  //       console.log(err);
  //       console.log("Registration unsuccessful!");
  //     }
  //   });
  });


  
  app.post("/login", function(req, res, next) {
    passport.authenticate("local", function(err, user, info) {
      if (err) {
        console.log(err);
        return next(err);
      }
      if (!user) {
        console.log("Login unsuccessful.");
        return res.redirect("/login");
      }
      req.logIn(user, function(err) {
        if (err) {
          console.log(err);
          return next(err);
        }
        console.log("Login successful.");
        return res.redirect("/secrets");
      });
    })(req, res, next);
  });
  
  


  //   const email = req.body.username;
  //   const password = req.body.password;
  
  //   try {
  //     const foundUser = await User.findOne({ email: email });
  //     if (foundUser) {
  //       bcrypt.compare(password, foundUser.password, function(err, result) {
  //         if (result === true) {
  //           console.log("Login successful.");
  //           res.render("secrets");
  //         } else {
  //           console.log("Login unsuccessful.");
  //         }
  //       });
  //     } else {
  //       console.log("Login unsuccessful.");
  //     }
  //   } catch (err) {
  //     console.log(err);
  //   }

  // });
  

app.listen(3000, function(){
    console.log("Started listening at port 3000.");
});