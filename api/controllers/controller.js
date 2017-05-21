'use strict';
process.env = require('dotenv-safe').load().parsed;
//var cfg = JSON.parse(fs.readFileSync('./cfg.json', 'utf8'));
// load the Cloudant library
var cloudantURL = "https://" + process.env.CLOUDANT_USER + ":" + process.env.CLOUDANT_PSWD + "@" + process.env.CLOUDANT_HOST + ".cloudant.com";
var Cloudant = require('cloudant'),
  cloudant = Cloudant({
    url: cloudantURL
  }),
  db = cloudant.db.use("users");

var PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3');
var personality_insights = new PersonalityInsightsV3({
  username: process.env.PERSONALITY_USER,
  password: process.env.PERSONALITY_PSWD,
  version_date: '2017-12-31'
});

var LanguageTranslatorV2 = require('watson-developer-cloud/language-translator/v2');
var language_translator = new LanguageTranslatorV2({
  username: process.env.TRANSLATE_USER,
  password: process.env.TRANSLATE_PSWD,
  url: 'https://gateway.watsonplatform.net/language-translator/api/',
  version: 'v2'
});

var twitter = require('./twitter.js');

var vQue = [];
var tQue = [];

// create a document
var createDocument = function(newUser, callback) {
  console.log("Creating document 'mydoc'");
  // we are specifying the id of the document so we can update and delete it later
  db.insert(newUser, function(err, data) {
    console.log("Error:", err);
    console.log("Data:", data);
    callback(err, data);
  });
};

//login
exports.get_user = function(req, res) {
  var username = req.params.username;
  var password = req.params.password;

  //if db contains username, check password
  db.find({
    "selector": {
      "$and": [{
          "username": username
        },
        {
          "password": password
        }
      ]
    }
  }, function(er, result){
      console.log(er);
      console.log(result);
      res.json(result);
  });
};

exports.get_match_text = function(req, res){
  console.log('user ' + req.body.user + ' trys to connect');
  if (tQue.length === 0)
  {
    var usr = req.body.user;
    var id = req.body.id;
    tQue.push({user: usr, id: id});
    res.status(500).send('Wait');
  }
  else
  {
    var stuff = tQue.pop();
    console.log(stuff);
    res.json(stuff);
  }
};

exports.watson = function(req, res){
  var promise = twitter.getTweets(req.body.twitter);
  promise.then(function(tweetarr){
    var corpus = ''
    for(var t of tweetarr)
      corpus += t.text + '\n'

    var params = {
    // Get the content items from the JSON file.
    text : corpus,
    headers: {
      'accept-language': 'en',
      'accept': 'application/json',
    },
    consumption_preferences : true
    };
    personality_insights.profile(params, function(err, response) {
      if (err)
      {
        console.log('Error:', JSON.stringify(err, null, 3));
        res.json({error : err})
      }
      else
      {
        console.log('done!');
        var hobbies = process(response)
        console.log(hobbies)
        res.json(hobbies)
      }
    });
  }).catch(function(err) {
    console.log(JSON.stringify(err, null, 3));
    res.json({error : err})
  })
}
function process(response) {
  var hobbies = []
  var preferencecats = response.consumption_preferences
  for(var pc of preferencecats)
  {

    if(pc.consumption_preference_category_id == "consumption_preferences_health_and_activity")
    {
      for(var p of pc.consumption_preferences)
      {
        if(p.score > 0.8)
        {
          hobbies.push(p.name)
        }
      }
    }
  }
  return hobbies;
}


exports.translate = function(req, res){
  data = req.body;
  language_translator.translate({
  text: data.text, source : data.source, target: data.target },
  function (err, translation) {
    if (err)
    {
      console.log('Error:', err);
      res.json({error : err});
    }
    else
    {
      console.log(JSON.stringify(translation, null, 2));
      res.json(translation.translations[0].translation);
    }
});

}
