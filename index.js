/* eslint-disable no-undef */
/* eslint-disable no-console */
const express = require('express');
const bodyParser = require('body-parser');
const {
        dialogflow, 
        Permission,
        Suggestions
      } = require('actions-on-google');

const realFood = require('./realfoodScraper');
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

app.intent('Meal_Planner - no', (conv) => {
  return mealSearch(conv)
});



app.intent('Meal_Planner - yes', (conv) => {
  saveToDb(conv);
  conv.close("I have saved this for tonights dinner. Enjoy your meal, goodbye!")
});

function mealSearch(conv, food){
  if (conv.data.count === 0) {
    log.info('Count 0')
    return realFood.scrape(food)
  .then(function(result){
    conv.data.food = result
    move(conv.data.food, Math.floor(Math.random()*conv.data.food.length), conv.data.food.length -1);
    conv.data.foodChoice = conv.data.food.pop();
    conv.ask("Would you like " + conv.data.foodChoice[0]);
    conv.data.count++
    return 
  })
  } else {
    log.info('Count more than 0')
    move(conv.data.food, Math.floor(Math.random()*conv.data.food.length), conv.data.food.length -1);
    conv.data.foodChoice = conv.data.food.pop();
    conv.ask("Would you like " + conv.data.foodChoice[0]);
    conv.data.count++
    return 
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
  log.info(conv.user.storage.userId);
}

function saveToDb(conv){
  today = new Date();
  log.info(userId); 

  var collection = db.collection('testcollection'); 
  
  collection.updateOne(
    { "userId": userId },
    {
      "userId": userId,
      "meals": [{"date": today.toString(), "recipe": conv.data.foodChoice}]
    },
    { upsert: true },
    function(err, response){
      if (!err) {
        log.info(response)
      }
    });
}

const expressApp = express().use(bodyParser.json());

expressApp.post('/api/test', app);
expressApp.listen(port);