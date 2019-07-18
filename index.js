const express = require('express');
const bodyParser = require('body-parser');

const {
        dialogflow, 
        Permission,
        Suggestions
      } = require('actions-on-google');

const helpers = require('./helpers');
const dbutils = require('./dbutils');
const realFood = require('./realfoodScraper');
const bunyan = require('bunyan');
const log = bunyan.createLogger({name: "tmp"});
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
    userId = helpers.checkUserId(conv, userId);
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
    userId = helpers.checkUserId(conv, userId);
    conv.ask(new Suggestions('yes', 'no'));
  } else {
    // If the user accepted our request, store their name in
    // the 'conv.user.storage' object for future conversations.
    conv.user.storage.userName = conv.user.name.display;
    userId = helpers.checkUserId(conv, userId);
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
  let today = new Date(); 
  return dbutils.isMeal(conv, userId, today)
  .then(function(data) {
    if(data) {
      conv.ask("You already have a meal for this date, would you like to replace " + data.meals[0].recipe[0])
      conv.ask(new Suggestions('yes', 'no'))
      // return
    } else {
      dbutils.addToDb(conv, userId, today)
      conv.close("I have saved this for tonights dinner. Enjoy your meal, goodbye!")
      // return
  }});
 
  // var collection = db.collection('testcollection'); 
//   return collection.findOne({ "userId": userId , "meals.date": today.toDateString() })
//   .then(function(data) {
//     log.info("DATA " + data);
//     if (data) {
//       log.info("DATA")
//       conv.ask("You already have a meal for this date, would you like to replace " + data.meals[0].recipe[0])
//       conv.ask(new Suggestions('yes', 'no'));
//     } else {
//       log.info("NO DATA")
//       dbutils.addToDb(conv, userId, today)
//       conv.close("I have saved this for tonights dinner. Enjoy your meal, goodbye!")
//     }
//  })
});

app.intent('Replace_Current_Meal', (conv) => {
  let today = new Date(); 
  dbutils.updateRecipeInDb(conv, userId, today);
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
    helpers.move(conv.data.food, Math.floor(Math.random()*conv.data.food.length), conv.data.food.length -1);
    conv.data.foodChoice = conv.data.food.pop();
    conv.ask("Would you like " + conv.data.foodChoice[0]);
    conv.ask(new Suggestions('yes', 'no'));
    conv.data.count++
    return 
  })
  } else {
    helpers.move(conv.data.food, Math.floor(Math.random()*conv.data.food.length), conv.data.food.length -1);
    conv.data.foodChoice = conv.data.food.pop();
    conv.ask("Would you like " + conv.data.foodChoice[0]);
    conv.ask(new Suggestions('yes', 'no'));
    conv.data.count++
    return 
  }
}

const expressApp = express().use(bodyParser.json());

expressApp.post('/api/test', app);
expressApp.listen(port);

module.exports = {}