var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

// var PORT = 3000;

const PORT  = process.env.PORT || 8000;
// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Connect to the Mongo DB
// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);
// mongoose.connect("mongodb://localhost/week18Populater");

// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
 var temp_count = 0;
 let count;
  axios.get("http://www.espncricinfo.com/").then(function(response) {

    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    $(".contentItem__content").each(function(i, element) {
      // Save an empty result object
      var result = {};
      var matchFound = false;
      result.title = $(this).find($(".contentItem__title")).text();
      result.description = $(this).find($(".contentItem__subhead")).text();
      result.link = $(this).find($(".media-wrapper_image")).children("img").attr("data-default-src");
      result.storyLink = $(this).children("a").attr("href");

      db.Article.find({title: result.title},  function (err, docs) {
        if (!docs.length){
          db.Article.create(result)
        .then(function(dbArticle) {
          console.log("no match found written to db");
        })
        .catch(function(err) {
          return res.json(err);
        });
        } else {
          console.log("match found not saved to db")
        }
      });
    })

    // If we were able to successfully scrape and save an Article, send a message to the client

  })
res.send("scrape success");
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for getting all Articles from the db
app.get("/articles/saved", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({saved: true})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});



// Route for saving/updating an Article's associated Note
app.post("/articles/save/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  console.log(req.params.id);
  console.log(req.body.saved);
  db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: req.body.saved })
  .then(function(dbArticle) {
    // If we were able to successfully find Articles, send them back to the client
    res.json(dbArticle);
  })
  .catch(function(err) {
    // If an error occurred, send it to the client
    res.json(err);
  });
    
});


// Route for saving/updating an Article's associated Note
app.post("/articles/unsave/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  console.log(req.params.id);
  console.log(req.body.saved);
  db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: req.body.saved })
  .then(function(dbArticle) {
    // If we were able to successfully find Articles, send them back to the client
    res.json(dbArticle);
  })
  .catch(function(err) {
    // If an error occurred, send it to the client
    res.json(err);
  });
    
});





// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
