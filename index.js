const express = require('express');
const bodyParser = require('body-parser');

const {
        dialogflow, 
        Permission,
        Suggestions,
        BasicCard,
        Image,
        Button,
        BrowseCarousel,
        BrowseCarouselItem
      } = require('actions-on-google');

const helpers = require('./helpers');
const dbutils = require('./dbutils');
const realFood = require('./realfoodScraper');
const info = require('./prodInfoScraper');
const bunyan = require('bunyan');
const log = bunyan.createLogger({name: "tmp"});
let userId = null;

const port = process.env.PORT || 4567;

const app = dialogflow({debug: true});

app.intent('Default Welcome Intent', (conv) => {
  const googleName = conv.user.storage.userName;
  log.info('Stored Name ' + googleName)
  conv.data.food = [];
  conv.data.foodChoice = [];
  conv.data.info = [];
  conv.data.count = 0;
  conv.data.date = new Date().toString();

  if (!googleName) {
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

app.intent('actions_intent_PERMISSION', (conv, params, permissionGranted) => {
  if (!permissionGranted) {
    conv.ask(`OK, no worries. Would you like to plan a meal?`);
    userId = helpers.checkUserId(conv, userId);
    conv.ask(new Suggestions('yes', 'no'));
  } else {
    conv.user.storage.userName = conv.user.name.display;
    userId = helpers.checkUserId(conv, userId);
    conv.ask(`Thanks, ${conv.user.storage.userName}. ` +
      `Would you like to plan a meal?`);
    conv.ask(new Suggestions('yes', 'no'));
  }
});

app.intent('actions_intent_NO_INPUT', (conv) => {
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

app.intent('Meal_Planner', (conv, {food, food1, date}) => {
  log.info("Count Reset")
  conv.data.count = 0
  log.info("DATE FORMAT? " + date)
  if(date){
    conv.data.date = date
  }
  return countCheck(conv, food, food1)
});

app.intent('Meal_Rejected', (conv) => {
  return countCheck(conv)
});

app.intent('Meal_Accepted', (conv) => {
  let date = new Date(conv.data.date); 
  let dbFood = [];
  return dbutils.isMeal(conv, userId, date)
  .then(function(data) {
    if (data) {
      for (let i = 0; i < data.meals.length; i++) {
        log.info("started for loop")
        if(data.meals[i].date === date.toDateString()){
          dbFood = data.meals[i].recipe
          break
        }
      }
      log.info("dbFood" + dbFood)
      return info.scrape(dbFood[1])
      .then(function(foodInfo){
        log.info("scrape done")
        log.info("DATA after scrape" + data.meals)
        conv.ask("You already have a meal for this date, would you like to replace " + dbFood[0] + " with " + conv.data.foodChoice[0] + "?")
        conv.ask(new BrowseCarousel({
          items: [
            new BrowseCarouselItem({
              title: dbFood[0],
              url: ("https://realfood.tesco.com"+dbFood[1]+""),
              image: new Image({
                url: foodInfo[0],
                alt: 'Image of '+dbFood[0]+"",
              }),
            }),
            new BrowseCarouselItem({
              title: conv.data.foodChoice[0],
              url: ("https://realfood.tesco.com"+conv.data.foodChoice[1]+""),
              image: new Image({
                url: conv.data.info[0],
                alt: 'Image of '+conv.data.foodChoice[0]+"",
              }),
            }),
          ],
        }));
      conv.ask(new Suggestions('yes', 'no'));
      })
    } else {
      dbutils.addToDb(conv, userId, date)
      conv.close("I have saved this for tonights dinner. Enjoy your meal, goodbye!")
  }});
});

app.intent('Replace_Current_Meal', (conv) => {
  let date = new Date(conv.data.date); 
  dbutils.updateRecipeInDb(conv, userId, date);
  conv.close("I updated your meal choice. I hope its delicious, goodbye!")
});

app.intent('Keep_Current_Meal', (conv) => {
  conv.close("Ok, I haven't changed anything. Goodbye!")
});

function countCheck(conv, food, food1){
  if (conv.data.count === 0) {
    return realFood.scrape(food+"%20"+food1)
    .then(function(result){
      conv.data.food = result
      log.info("COUNT 0" + conv.data.food.length)
      return
    })
    .then(function(){
      return mealSearch(conv)
    })
  } else {
    log.info("COUNT > 0" + conv.data.food.length)
    return mealSearch(conv)
  }
}

function mealSearch(conv){
  if (conv.data.food.length > 0) {
    helpers.move(conv.data.food, Math.floor(Math.random()*conv.data.food.length), conv.data.food.length -1);

    conv.data.foodChoice = conv.data.food.pop();
    return info.scrape(conv.data.foodChoice[1])
      .then(function(foodInfo){
        conv.data.info = foodInfo;
        conv.ask("Would you like " + conv.data.foodChoice[0]);
        conv.ask(new BasicCard({
          title: conv.data.foodChoice[0],
          buttons: new Button({
            title: 'View on Tesco Realfood',
            url: ("https://realfood.tesco.com"+conv.data.foodChoice[1]+""),
          }),
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
  } else {
    conv.ask("That's all the results, please search for something else");
  }
}

const expressApp = express().use(bodyParser.json());

expressApp.post('/api/test', app);
expressApp.listen(port);

module.exports = {}