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

const port = process.env.PORT || 4567;

const app = dialogflow({debug: true});

app.intent('Default Welcome Intent', (conv) => {
  const name = conv.user.storage.userName;
  if (!name) {
    // Asks the user's permission to know their name, for personalization.
    conv.ask(new Permission({
      context: 'Hi there, to get to know you better',
      permissions: 'NAME',
    }));
  } else {
    conv.ask(`Hi again, ${name}. Would you like to plan a meal?`);
    conv.ask(new Suggestions('yes', 'no'));
  }
});

// Handle the Dialogflow intent named 'actions_intent_PERMISSION'. If user
// agreed to PERMISSION prompt, then boolean value 'permissionGranted' is true.
app.intent('actions_intent_PERMISSION', (conv, params, permissionGranted) => {
  if (!permissionGranted) {
    // If the user denied our request, go ahead with the conversation.
    conv.ask(`OK, no worries. Would you like to plan a meal?`);
    conv.ask(new Suggestions('yes', 'no'));
  } else {
    // If the user accepted our request, store their name in
    // the 'conv.user.storage' object for future conversations.
    conv.user.storage.userName = conv.user.name.display;
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
  log.info('Start')
  return realFood.scrape(food)
  .then(function(result){
    log.info('Result Returned before Conv')
    conv.ask("Would you like " + result[Math.floor(Math.random() * result.length)][0]);
    log.info('After Conv')
    return 
  })
});



const expressApp = express().use(bodyParser.json());

expressApp.post('/api/test', app);
expressApp.listen(port);