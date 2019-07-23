/* eslint-disable no-console */
/* eslint-disable no-undef */
const rp = require('request-promise');
const $ = require('cheerio');
const url = "https://realfood.tesco.com/search.html?";
const bunyan = require('bunyan');
const log = bunyan.createLogger({name: "scrape"});
const Nightmare = require('nightmare');

const foodSearch = "#!q='search%3D"
const results = '%26perpage%3D'
const totalCookingTime = '%26TotalCookingTime%3D'
const course = '%26Course%3D'
const caloriesFrom = '%26calories-from%3D'
const caloriesTo = '%26calories-to%3D'
const collection = '%26Collection%3D'
const dietaryRequirements = '%26DietaryOption%3D'
const cuisine = '%26Cuisine%3D'
const occasion = '%26Occasion%3D'
const subtype = '%26SubType%3D'

exports.quickScrape = function (searchTerm, resultsInput, cookingTimeInput, courseInput, calsFromInput, calsToInput, collectionInput, dietaryRequirementsInput, cuisineInput, occasionInput, subtypeInput) {
  log.info('Start Scrape')
  var searchUrl = (searchTerm === undefined ? '' : "search="+searchTerm+foodSearch+searchTerm)
  var resultsUrl = (resultsInput === undefined ? '' : results+resultsInput)
  var cookingTimeUrl = (cookingTimeInput === undefined ? '' : totalCookingTime+cookingTimeInput)
  var courseUrl = (courseInput === undefined ? '' : course+courseInput)
  var caloriesFromUrl = (calsFromInput === undefined ? '' : caloriesFrom+calsFromInput)
  var caloriesToUrl = (calsToInput === undefined ? '' : caloriesTo+calsToInput)
  var collectionUrl = (collectionInput === undefined ? '' : collection+collectionInput)
  var dietaryRequirementsUrl = (dietaryRequirementsInput === undefined ? '' : dietaryRequirements+dietaryRequirementsInput)
  var cuisineUrl = (cuisineInput === undefined ? '' : cuisine+cuisineInput)
  var occasionUrl = (occasionInput === undefined ? '' : occasion+occasionInput)
  var subtypeUrl = (subtypeInput === undefined ? '' : subtype+subtypeInput)

  var website = url+searchUrl+resultsUrl+cookingTimeUrl+courseUrl+caloriesFromUrl+caloriesToUrl+collectionUrl+dietaryRequirementsUrl+cuisineUrl+occasionUrl+subtypeUrl
  return rp(website)
    .then(function(html){
      return cheerio(html)
    })
};

exports.nightmareScrape = function(searchTerm, resultsInput, cookingTimeInput, courseInput, calsFromInput, calsToInput, collectionInput, dietaryRequirementsInput, cuisineInput, occasionInput, subtypeInput) {
  var searchUrl = (searchTerm === undefined ? '' : "search="+searchTerm+foodSearch+searchTerm)
  var resultsUrl = (resultsInput === undefined ? '' : results+resultsInput)
  var cookingTimeUrl = (cookingTimeInput === undefined ? '' : totalCookingTime+cookingTimeInput)
  var courseUrl = (courseInput === undefined ? '' : course+courseInput)
  var caloriesFromUrl = (calsFromInput === undefined ? '' : caloriesFrom+calsFromInput)
  var caloriesToUrl = (calsToInput === undefined ? '' : caloriesTo+calsToInput)
  var collectionUrl = (collectionInput === undefined ? '' : collection+collectionInput)
  var dietaryRequirementsUrl = (dietaryRequirementsInput === undefined ? '' : dietaryRequirements+dietaryRequirementsInput)
  var cuisineUrl = (cuisineInput === undefined ? '' : cuisine+cuisineInput)
  var occasionUrl = (occasionInput === undefined ? '' : occasion+occasionInput)
  var subtypeUrl = (subtypeInput === undefined ? '' : subtype+"RECIPE")

  var website = url+searchUrl+resultsUrl+cookingTimeUrl+courseUrl+caloriesFromUrl+caloriesToUrl+collectionUrl+dietaryRequirementsUrl+cuisineUrl+occasionUrl+subtypeUrl

  console.log(website)
  log.info("Start Nightmare")
  new Nightmare ({ pollInterval: 50 })
    .goto(website)
    .wait('body')
    .evaluate(() => document.querySelector('body').innerHTML)
    .end()
    .then(response => {
      log.info("Nightmare Finished")
      cheerio(response)
    }).catch(err => {
      console.log(err)
    });

}

function cheerio(data){
  var recipes = []
  var tempArray = []
  log.info("Cheerio Start")

    var recipeLinks = $('.recipe-link', data);
    var recipeList = $('.recipe-list-item', data);
    var recipePic = $('.recipe-list-item-visual img', data);

    for (let i = 0; i < recipeList.length; i++) {
      if(recipeLinks[i].attribs.href.substring(0,8) == "/recipes") {
        tempArray.push(recipeLinks[i].attribs.title);
        tempArray.push(recipeLinks[i].attribs.href);
        tempArray.push(recipeList[i].attribs["data-objecttype"]);
        tempArray.push(recipeList[i].attribs["data-cookingtime"]);
        tempArray.push(recipeList[i].attribs["data-summary"].toString().replace(/(<strong>|<\/strong>)/gm,''));
        tempArray.push(recipeList[i].attribs["data-serves"]);
        tempArray.push(recipeList[i].attribs["data-calories"]);
        tempArray.push(recipeList[i].attribs["data-freezable"]);
        tempArray.push(recipeList[i].attribs["data-healthy"]);
        tempArray.push((recipePic[i].attribs.src).replace(" ", "%20"));
        recipes.push(tempArray);
        tempArray = []
      }
    }
  log.info("Cheerio Finished")
  console.log(recipes)
  return recipes;
}


/*
SELECTION OPTIONS

"https://realfood.tesco.com/search.html?"  // All Recipes

const foodSearch = '#!q=search%3D'
[searchTerm]

const results = 'perpage%3D'
[numberOfResults]

const totalCookingTime = '%26TotalCookingTime%3D'
['29', '60', '99999']

const course = '%26Course%3D'
['Dinner', 'Lunch', 'Side+dish', 'Starter', 'Breakfast', 'Dessert', 'Brunch', 'Drinks', 'Canapes']

const caloriesFrom = '%26calories-from%3D'
[caloriesFrom]
const caloriesTo = '%26calories-to%3D'
[caloriesTo]

const collection = '%26Collection%3D'
['Family+favourites', 'Healthy', 'On+a+budget', 'Baking', 'Barbecue', 'Night+in+for+two']

const dietaryRequirements = '%26DietaryOption%3D'
['egg+free', 'dairy+free', 'gluten+free', 'wheat+free', 'low+calorie', 'low+fat', 'nut+free', 'vegetarian', 'diabetic', 'vegan']

const cuisine = '%26Cuisine%3D'
['British', 'American', 'Chinese', 'French', 'Greek', 'Indian', 'Italian', 'Mexican', 'Spanish', 'Thai']

const occasion = '%26Occasion%3D'
['Christmas', 'Valentine%2527s+Day', 'Chinese+new+year', 'Easter', 'Mother%2527s+Day', 'Halloween', 'Bonfire+night', 'Father%2527s+Day']

const subtype = '%26SubType%3D'
['RECIPE', 'GALLERY', 'STEPBYSTEP', 'CURATEDLIST']
*/


// exports.phantom = async function (searchTerm, resultsInput, cookingTimeInput, courseInput, calsFromInput, calsToInput, collectionInput, dietaryRequirementsInput, cuisineInput, occasionInput, subtypeInput) {
  
//   var searchUrl = (searchTerm === undefined ? '' : foodSearch+searchTerm)
//   var resultsUrl = (resultsInput === undefined ? '' : results+resultsInput)
//   var cookingTimeUrl = (cookingTimeInput === undefined ? '' : totalCookingTime+cookingTimeInput)
//   var courseUrl = (courseInput === undefined ? '' : course+courseInput)
//   var caloriesFromUrl = (calsFromInput === undefined ? '' : caloriesFrom+calsFromInput)
//   var caloriesToUrl = (calsToInput === undefined ? '' : caloriesTo+calsToInput)
//   var collectionUrl = (collectionInput === undefined ? '' : collection+collectionInput)
//   var dietaryRequirementsUrl = (dietaryRequirementsInput === undefined ? '' : dietaryRequirements+dietaryRequirementsInput)
//   var cuisineUrl = (cuisineInput === undefined ? '' : cuisine+cuisineInput)
//   var occasionUrl = (occasionInput === undefined ? '' : occasion+occasionInput)
//   var subtypeUrl = (subtypeInput === undefined ? '' : subtype+subtypeInput)

//   var website = url+"'"+searchUrl+resultsUrl+cookingTimeUrl+courseUrl+caloriesFromUrl+caloriesToUrl+collectionUrl+dietaryRequirementsUrl+cuisineUrl+occasionUrl+subtypeUrl+"'"
  
//   var recipes = []
//   var tempArray = []
//   console.log(website)
//   log.info("Phantom Start")
//     const instance = await phantom.create();
//     const page = await instance.createPage();
//     page.property('loadImages', false);
//     page.property('resourceTimeout', 3000);
//     await page.on("onResourceRequested", function(requestData) {
//         // console.info('Requesting', requestData.url)
//     });

//     const status = await page.open(website);
//     // console.log(status);

//     const content = await page.property('content');
//     log.info("Phantom Finished")

//     log.info("Cheerio Start")
//     var recipeLinks = $('.recipe-link', content);

//     for (let i = 0; i < recipeLinks.length; i++) {
//       if(recipeLinks[i].attribs.href.substring(0,8) == "/recipes") {
//         tempArray.push(recipeLinks[i].attribs.title);
//         tempArray.push(recipeLinks[i].attribs.href);
//         recipes.push(tempArray);
//         tempArray = []
//       }
//     }
//     log.info("Cheerio Finished")
//     console.log(recipes)

//     await instance.exit();

// };