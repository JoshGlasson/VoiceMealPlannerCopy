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
        BrowseCarouselItem,
        SimpleResponse
      } = require('actions-on-google');

const helpers = require('./helpers');
const dbutils = require('./dbutils');
const apiSearch = require('./apiCall');
const bunyan = require('bunyan');
const log = bunyan.createLogger({name: "tmp"});

const port = process.env.PORT || 4567;

const app = dialogflow({debug: true});

app.intent('Default Welcome Intent', (conv) => {
  const googleName = conv.user.storage.userName;
  log.info('Stored Name ' + googleName)
  conv.data.food = [];
  conv.data.foodChoice = [];
  conv.data.info = [];
  conv.data.count = 0;
  conv.data.date = false;
  conv.data.mealData = {};
  conv.data.preferences = [];
  conv.data.userId = null;

  if (!googleName) {
    conv.ask(new Permission({
      context: 'Hi there, to get to know you better',
      permissions: 'NAME',
    }));
  } else {
    conv.data.userId = helpers.checkUserId(conv, conv.data.userId);

    return dbutils.loadPrefences(conv.data.userId).then((response) => {
      conv.data.preferences = response
      conv.ask(`Hi again, ${googleName}. Would you like to plan a meal, manage your preferences or review food diary?`);
      conv.ask(new Suggestions('plan a meal', 'preferences', 'food diary' ));
    });
  }
});

app.intent('actions_intent_PERMISSION', (conv, params, permissionGranted) => {
  if (!permissionGranted) {
    conv.ask(`OK, no worries. Would you like to plan a meal, manage your preferences or review food diary?`);
    conv.data.userId = helpers.checkUserId(conv, conv.data.userId);
    conv.ask(new Suggestions('plan a meal', 'preferences', 'food diary'));
  } else {
    conv.user.storage.userName = conv.user.name.display;
    conv.data.userId = helpers.checkUserId(conv, conv.data.userId);
    conv.ask(`Thanks, ${conv.user.storage.userName}. ` +
      `Would you like to plan a meal, manage your preferences or review food diary`);
    conv.ask(new Suggestions('plan a meal', 'preferences', 'food diary'));
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
  conv.data.count = 0
  if(date){
    conv.data.date = date
  }
  return countCheck(conv, food, food1)
});

app.intent('Meal_Rejected', (conv) => {
  return countCheck(conv)
});

app.intent('Keep_Current_Meal', (conv) => {
  conv.data.date = false;
  conv.ask("Ok, would you like to save this for a different date, or start again?")
  conv.ask(new Suggestions('new date', 'main menu'));
});

app.intent('Meal_Accepted', (conv) => {
  if(!conv.data.date){
    conv.ask("What day do you want this meal on?")
  } else {
    return replaceCheck(conv, conv.data.date)
  }
});

app.intent('Replace_Current_Meal', (conv) => {
  let date = conv.data.date; 
  dbutils.updateRecipeInDb(conv, conv.data.userId, date);
  conv.data.date = false; 
  conv.close(`I updated your meal choice for ${new Date(date).toDateString()}. I hope its delicious, goodbye!`)
});

app.intent('Set_Date', (conv, {date}) => {
  conv.data.date = date;
  return replaceCheck(conv, date)
});

function countCheck(conv, food, food1){
  if (conv.data.count === 0) {
  return apiSearch.searchRecipes(`${food} ${food1}`,conv.data.preferences)
  .then(function(result){
    conv.data.food = result
    log.info("COUNT 0" + conv.data.food.length)
    return showRecipe(conv)
  })
  } else {
    log.info("COUNT > 0" + conv.data.food.length)
      return showRecipe(conv)
  }
}

function replaceCheck(conv, date){
  log.info("CHECK DB")
  return dbutils.isMeal(conv, conv.data.userId, date)
  .then(function(data) {
    log.info("INFO BACK FROM DB")
    if (data) {
      return apiSearch.getRecipeInfo(data)
      .then(function(foodInfo){
        log.info("FOUND IN DB "+ foodInfo)
        conv.ask(`You already have a meal for this date, would you like to replace ${foodInfo.recipe} with ${conv.data.foodChoice.recipe}?`)
        conv.ask(new BrowseCarousel({
          items: [
            new BrowseCarouselItem({
              title: foodInfo.recipe,
              url: `https://realfood.tesco.com${foodInfo.details.href}`,
              image: new Image({
                url: `https://realfood.tesco.com${foodInfo.details.imageLink}`,
                alt: `Image of ${foodInfo.recipe}`,
              }),
            }),
            new BrowseCarouselItem({
              title: conv.data.foodChoice.recipe,
              url: `https://realfood.tesco.com${conv.data.foodChoice.details.href}`,
              image: new Image({
                url: `https://realfood.tesco.com${conv.data.foodChoice.details.imageLink}`,
                alt: `Image of ${conv.data.foodChoice.recipe}`,
              }),
            }),
          ],
        }));
      conv.ask(new Suggestions('yes', 'no'))})  
    } else {
      dbutils.addToDb(conv, conv.data.userId, date)
      conv.data.date = false;
      conv.close(`I have saved this for ${new Date(date).toDateString()}. Enjoy your meal, goodbye!`)
  }
})}

function showRecipe(conv){
  if (conv.data.food.length > 0) {
    helpers.move(conv.data.food, Math.floor(Math.random()*conv.data.food.length), conv.data.food.length -1);

    conv.data.foodChoice = conv.data.food.pop();
    conv.ask("Would you like " + conv.data.foodChoice.recipe);
    conv.ask(new BasicCard({
      title: conv.data.foodChoice.recipe,
      buttons: new Button({
        title: 'View on Tesco Realfood',
        url: `https://realfood.tesco.com${conv.data.foodChoice.details.href}`,
      }),
      subtitle: conv.data.foodChoice.details.summary,
      text: (conv.data.foodChoice.details.cookingTime === undefined ? "" : `${conv.data.foodChoice.details.cookingTime}. `) 
      + (conv.data.foodChoice.details.serves === "False" ? "" : `Serves ${conv.data.foodChoice.details.serves}. `) 
      + (conv.data.foodChoice.details.calories === "False" ? "" : `${conv.data.foodChoice.details.calories} Calories per Serving. `) 
      + (conv.data.foodChoice.details.freezable === "False" ? "" : "Freezable" + ". ") 
      + (conv.data.foodChoice.details.healthy === "False" ? "" : "Healthy" + ". "), 
      image: new Image({
        url: `https://realfood.tesco.com${conv.data.foodChoice.details.imageLink}`,
                alt: `Image of ${conv.data.foodChoice.recipe}`,
      }),
    }));
    conv.ask(new Suggestions('yes', 'no'));
    conv.data.count++
    return 
  } else {
    conv.ask("That's all the results, please search for something else");
  }
}

app.intent("Default Welcome Intent - preferences", (conv) => {
  if (conv.data.preferences.length === 0){
    conv.ask('You have no preferences set, would you like to add a preference?')
    conv.ask(new Suggestions('Add', 'No' ));
  } else {
    conv.ask(`Your current preferences are ${conv.data.preferences}. Would you like to add or remove any preferences?`)
    conv.ask(new Suggestions('Add', 'Remove', 'Back'));
  }
});

app.intent("Preferences",(conv, {preferences}) => {
  log.info("Preferences before" + conv.data.preferences)
  if (!conv.data.preferences.includes(preferences)){
    conv.data.preferences.push(preferences);
    dbutils.savePrefences(conv, conv.data.userId);
    log.info("Preferences after" + conv.data.preferences)
  conv.ask("Got it, saved " + conv.data.preferences + ". Would you like to set anymore preferences?");
  } else {
    conv.ask("This preference is already set. Would you like to set anymore preferences?")
  }
  conv.ask(new Suggestions('yes', 'no'));
});

app.intent("Default Welcome Intent - preferences - remove - value", (conv, {preferences}) => {
  conv.data.preferences = conv.data.preferences.filter(function(value){
    return value != preferences;
  });
  dbutils.savePrefences(conv, conv.data.userId);
  if (conv.data.preferences.length === 0){
      conv.followup("EMPTY", JSON.parse(helpers.inputParameters("preferences")) );
  } 
  else {
    conv.ask("I've updated your preferences to " + conv.data.preferences + ". Would you like to remove anymore preferences?");
    conv.ask(new Suggestions('yes', 'no'));
  }
});

app.intent("Review_Food_Diary - date", (conv, {date}) => {
  conv.data.date = date;
  return dbutils.isMeal(conv, conv.data.userId, date)
  .then(function(data) {
    log.info("INFO BACK FROM DB")
    if (data) {
      log.info(data)
      return apiSearch.getRecipeInfo(data)
      .then(function(foodInfo){
        log.info("FOUND IN DB "+ foodInfo)
        conv.ask(`On ${new Date(date).toDateString()} you have ${foodInfo.recipe}`)
        conv.ask(new BasicCard({
          title: foodInfo.recipe,
          buttons: new Button({
            title: 'View on Tesco Realfood',
            url: `https://realfood.tesco.com${foodInfo.details.href}`,
          }),
          subtitle: foodInfo.details.summary,
          text: (foodInfo.details.cookingTime === undefined ? "" : `${foodInfo.details.cookingTime}. `) 
          + (foodInfo.details.serves === "False" ? "" : `Serves ${foodInfo.details.serves}. `) 
          + (foodInfo.details.calories === "False" ? "" : `${foodInfo.details.calories} Calories per Serving. `) 
          + (foodInfo.details.freezable === "False" ? "" : "Freezable" + ". ") 
          + (foodInfo.details.healthy === "False" ? "" : "Healthy" + ". "), 
          image: new Image({
            url: `https://realfood.tesco.com${foodInfo.details.imageLink}`,
                    alt: `Image of ${foodInfo.recipe}`,
          }),
        }))
        conv.ask(`Do you want to change, remove this or check another date?`)
        conv.ask(new Suggestions('change', 'remove', "another date")); 
      })
    } else {
      conv.ask(`You have nothing planned for ${new Date(date).toDateString()}. `)
      conv.ask(`Do you want to add a meal on that date or check another date?`)
      conv.ask(new Suggestions('add meal', 'another date'));
    }
  });
})

app.intent("Review_Food_Diary - time period", (conv, {duration, week}) => {
  let days = 0
  if(duration) {
    duration.amount > 7 ? days = 7 : days = duration.amount
  } else if(week) {
    days = 7
  } 
  return dbutils.foodDiaryCheck(conv.data.userId, days)
  .then(function(result){
    let string = ""
    let speech = ""
    for(let meal of result) {
      log.info(`RECIPEM: ${meal['recipe']}`)
      if (!meal['recipe'].toString().includes("false")) {
        // <say-as interpret-as="date" format="dm">10-9</say-as>
        string = string + `You have ${meal['recipe']} on ${new Date(meal['date']).toDateString()}\n`
        speech = speech + `You have ${meal['recipe']} on <say-as interpret-as="date" format="dm"> ${new Date(meal['date']).toDateString()} </say-as> <break time="500ms"/>`
      }
    }
    if(string === "") {
      conv.ask("You have nothing planned for this period. Do you want to check any other date?")
    } else {
    conv.ask(new SimpleResponse({
      speech: '<speak>' + speech + ' Do you want to check any other date?</speak>',
      text: string + ' Do you want to check any other date?'  
    }))
    }
    conv.ask(new Suggestions('yes', 'no')); 
  })
})

app.intent('Review_Food_Diary - date - remove', (conv) => {
  dbutils.deleteMeal(conv, conv.data.userId, conv.data.date);
  conv.ask("I have removed this meal. Do you want to check any other date?")
  conv.ask(new Suggestions('yes', 'no')); 
});


const expressApp = express().use(bodyParser.json());

expressApp.post('/api/test', app);
expressApp.listen(port);

module.exports = {}