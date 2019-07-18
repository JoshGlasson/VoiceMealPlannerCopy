/* eslint-disable no-undef */
/* eslint-disable no-console */
const express = require('express');
const bodyParser = require('body-parser');
const {
        dialogflow, 
        Permission,
        Suggestions,
        BasicCard,
        Image
      } = require('actions-on-google');

const realFood = require('./realfoodScraper');
const info = require('./prodInfoScraper');
const bunyan = require('bunyan');
const log = bunyan.createLogger({name: "tmp"});
const generateUUID = require('uuid/v4');
let userId = null;

const port = process.env.PORT || 4567;

const app = dialogflow({debug: true});

var mongoClient = require("mongodb").MongoClient;
var db = {};

mongoClient.connect("mongodb://tmptest:kEecgUIWgCcht8qjBhYNDJajOKt0JVj1rynvPPxgsDRv30AL6SLilUVgCjmgGEkT9L2Pnxj8ZiXjjwgvnkfpLw%3D%3D@tmptest.documents.azure.com:10255/?ssl=true", { useNewUrlParser: true },function (err, client) {
  db = client.db("testdatabase");  
});

app.intent('Default Welcome Intent', (conv) => {
  const googleName = conv.user.storage.userName;
  log.info('Stored Name ' + googleName)
  conv.data.food = [];
  conv.data.foodChoice = [];
  conv.data.info = [];
  conv.data.count = 0

  if (!googleName) {
    // Asks the user's permission to know their name, for personalization.
    conv.ask(new Permission({
      context: 'Hi there, to get to know you better',
      permissions: 'NAME',
    }));
  } else {
    checkUserId(conv);
    conv.ask(`Hi again, ${googleName}. Would you like to plan a meal?`);
    conv.ask(new Suggestions('yes', 'no'));
  }
});

// Handle the Dialogflow intent named 'actions_intent_PERMISSION'. If user
// agreed to PERMISSION prompt, then boolean value 'permissionGranted' is true.
app.intent('actions_intent_PERMISSION', (conv, params, permissionGranted) => {
  if (!permissionGranted) {
    // If the user denied our request, go ahead with the conversation.
    conv.ask(`OK, no worries. Would you like to plan a meal?`);
    checkUserId(conv);
    conv.ask(new Suggestions('yes', 'no'));
  } else {
    // If the user accepted our request, store their name in
    // the 'conv.user.storage' object for future conversations.
    conv.user.storage.userName = conv.user.name.display;
    checkUserId(conv);
    conv.ask(`Thanks, ${conv.user.storage.userName}. ` +
      `Would you like to plan a meal?`);
    conv.ask(new Suggestions('yes', 'no'));
  }
});

// Handle the Dialogflow NO_INPUT intent.
// Triggered when the user doesn't provide input to the Action
app.intent('actions_intent_NO_INPUT', (conv) => {
  // Use the number of reprompts to vary response
  const repromptCount = parseInt(conv.arguments.get('REPROMPT_COUNT'));
  if (repromptCount === 0) {
    conv.ask('What would you like to eat?');
  } else if (repromptCount === 1) {
    conv.ask(`Let me know what you want to eat`);
  } else if (conv.arguments.get('IS_FINAL_REPROMPT')) {
    conv.close(`Sorry we're having trouble. Let's ` +
      `try this again later. Goodbye.`);
  }
});

app.intent('Meal_Planner', (conv, {food}) => {
  conv.data.count = 0
  return mealSearch(conv, food)
});

app.intent('Meal_Rejected', (conv) => {
  return mealSearch(conv)
});

app.intent('Meal_Accepted', (conv) => {
  today = new Date(); 
  var collection = db.collection('testcollection'); 
  return collection.findOne({ "userId": userId , "meals.date": today.toDateString() })
  .then(function(data) {
    log.info("DATA " + data);
    if (data) {
      log.info("DATA")
      conv.ask("You already have a meal for this date, would you like to replace " + data.meals[0].recipe[0])
      conv.ask(new Suggestions('yes', 'no'));
    } else {
      log.info("NO DATA")
      addToDb(conv)
      conv.close("I have saved this for tonights dinner. Enjoy your meal, goodbye!")
    }
 })
});

app.intent('Replace_Current_Meal', (conv) => {
  updateRecipeInDb(conv);
  conv.close("I updated your meal choice. I hope its delicious, goodbye!")
});

app.intent('Keep_Current_Meal', (conv) => {
  conv.close("Ok, I haven't changed anything. Goodbye!")
});

function mealSearch(conv, food){
  if (conv.data.count === 0) {
    return realFood.scrape(food)
  .then(function(result){
    conv.data.food = result
    move(conv.data.food, Math.floor(Math.random()*conv.data.food.length), conv.data.food.length -1);
    conv.data.foodChoice = conv.data.food.pop();
    return info.scrape(conv.data.foodChoice[1])
    .then(function(foodInfo){
      conv.data.info = foodInfo;
      conv.ask("Would you like " + conv.data.foodChoice[0]);
      conv.ask(new BasicCard({
        title: conv.data.foodChoice[0],
        subtitle: conv.data.info[1],
        text: (conv.data.info[2] === undefined ? "" : conv.data.info[2] + ". ") 
        + (conv.data.info[3] === undefined ? "" : conv.data.info[3] + ". ") 
        + (conv.data.info[4] === undefined ? "" : conv.data.info[4] + ". ") 
        + (conv.data.info[5] === undefined ? "" : conv.data.info[5] + ". "), 
        image: new Image({
          url: conv.data.info[0],
          alt: "Image of food",
        }),
      }));
      conv.ask(new Suggestions('yes', 'no'));
      conv.data.count++
      return 
    })
  })
  } else {
    move(conv.data.food, Math.floor(Math.random()*conv.data.food.length), conv.data.food.length -1);
    conv.data.foodChoice = conv.data.food.pop();
    return info.scrape(conv.data.foodChoice[1])
    .then(function(foodInfo){
      conv.data.info = foodInfo;
      conv.ask("Would you like " + conv.data.foodChoice[0]);
      conv.ask(new BasicCard({
        title: conv.data.foodChoice[0],
        subtitle: conv.data.info[1],
        text: (conv.data.info[2] === undefined ? "" : conv.data.info[2] + ". ") 
        + (conv.data.info[3] === undefined ? "" : conv.data.info[3] + ". ") 
        + (conv.data.info[4] === undefined ? "" : conv.data.info[4] + ". ") 
        + (conv.data.info[5] === undefined ? "" : conv.data.info[5] + ". "),        
        image: new Image({
          url: conv.data.info[0],
          alt: "Image of food",
        }),
      }));
      conv.ask(new Suggestions('yes', 'no'));
    })
  }
}

function move(array, oldIndex, newIndex){
  if(newIndex >= array.length) {
    newIndex = array.length - 1;
  }
  array.splice(newIndex,0,array.splice(oldIndex, 1)[0])
  return array;
}

function checkUserId(conv){
  if ('userId' in conv.user.storage) {
    userId = conv.user.storage.userId;
  } else {
    userId = generateUUID();
    conv.user.storage.userId = userId
  }
}

function updateRecipeInDb(conv){
  var collection = db.collection('testcollection'); 
  collection.updateOne(
    { "userId": userId , "meals.date": today.toDateString() },
    { $set: { "meals.$.recipe": conv.data.foodChoice} },
    { upsert: true },
    function(err, response){
      if (!err) {
        log.info("UPDATE " + response)
      }
  });
}

function addToDb(conv){
  var collection = db.collection('testcollection'); 
  collection.findOneAndUpdate(
    { "userId": userId },
    { $push : {
        "meals": {"date": today.toDateString(), "recipe": conv.data.foodChoice}
      }
    },
    { upsert: true },
    function(err, response){
      if (!err) {
        log.info("ADD "+ response)
      }
    });
}

const expressApp = express().use(bodyParser.json());

expressApp.post('/api/test', app);
expressApp.listen(port);