/* eslint-disable no-undef */
const rp = require('request-promise');
const $ = require('cheerio');
const url = "https://realfood.tesco.com";
const bunyan = require('bunyan');
const log = bunyan.createLogger({name: "info_scrape"});


exports.scrape = function (link) {
  log.info('Start Scrape')
  var productInfo = []
  var website = url+link
  return rp(website)
    .then(function(html){
      log.info('Add to Array')
      var recipePic = $('.recipe-detail__img', html);
      var recipeIntro = $('.recipe-detail__intro', html);
      var recipeServings = $('.recipe-detail__meta li', html);
    
    for (let i = 0; i < recipePic.length; i++) {
        productInfo.push((url+recipePic[0].attribs.src).replace(" ", "%20"));
    }
    for (let i = 0; i < recipeIntro.length; i++) {
        productInfo.push(recipeIntro.contents()[0].data.toString().replace(/(\r\n|\n|\r|\t)/gm,''));
    }
    for (let i = 0; i < recipeServings.length; i++) {
        productInfo.push(recipeServings.contents()[i].data.toString().replace(/(\r\n|\n|\r|\t)/gm,''));
    }
    
      log.info('Scrape Finished')
      return productInfo;
    })
};


exports.nutritionScrape = function (link) {
  log.info('Nutrition Start Scrape')
  var nutriInfo = []
  var website = url+link
  return rp(website)
    .then(function(html){
      log.info('Nutrition Add to Array')
      var recipeCalories = $("*[itemprop = 'calories']", html);
      var recipeFat = $("*[itemprop = 'fatContent']", html);
      var recipeSaturates = $("*[itemprop = 'saturatedFatcontent']", html);
      var recipeSugars = $("*[itemprop = 'sugarContent']", html);
      var recipeSalt = $('.recipe-detail__nutrition-value', html);
      var recipeCarbs = $("*[itemprop = 'carbohydratecontent']", html);
      var recipeProtein = $("*[itemprop = 'proteincontent']", html);
      var recipeFibre = $("*[itemprop = 'fibercontent']", html);
    

    nutriInfo.push((recipeCalories.text().substr(0, (recipeCalories.text().length - 4))) + " calories");
    nutriInfo.push(recipeFat.text()  + " of fat");
    nutriInfo.push(recipeSaturates.text()  + " of saturated fat");
    nutriInfo.push(recipeSugars.text() + " of sugar");
    nutriInfo.push(recipeSalt.contents().last().text().replace(/(\r\n|\n|\r|\t)/gm,'') + " of salt");
    nutriInfo.push(recipeCarbs.text() + " of carbohydrates");
    nutriInfo.push(recipeProtein.text() + " of protein");
    nutriInfo.push(recipeFibre.text() + " of fibre");

      log.info('Nutrition Scrape Finished')
      return nutriInfo;
    })
};

exports.ingredientsScrape = function (link) {
  log.info('Ingredients Start Scrape')
  var ingredients = []
  var website = url+link
  return rp(website)
    .then(function(html){
      log.info('Ingredients Add to Array')
      var recipeIngredients = $(".recipe-detail__list li", html);

      for (let i = 0; i < recipeIngredients.length; i++) {
        ingredients.push(recipeIngredients.contents()[i].data.toString());
      }

      log.info('Ingredients Scrape Finished')
      return ingredients;
    })
};