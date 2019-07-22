/* eslint-disable no-undef */
const rp = require('request-promise');
const $ = require('cheerio');
const url = "https://realfood.tesco.com/search.html?search=";
const bunyan = require('bunyan');
const log = bunyan.createLogger({name: "scrape"});
var phantom = require("phantom");



exports.scrape = function (searchTerm) {
  log.info('Start Scrape')
  var recipes = []
  var website = url+searchTerm+"#!q='search%3D"+searchTerm+"%26perpage%3D200'"
  return rp(website)
    .then(function(html){
      log.info('Add to Array')
      var tempArray = []
      var recipeLinks = $('.recipe-link', html);

      for (let i = 0; i < recipeLinks.length; i++) {
        if(recipeLinks[i].attribs.href.substring(0,8) == "/recipes") {
          tempArray.push(recipeLinks[i].attribs.title);
          tempArray.push(recipeLinks[i].attribs.href);
          recipes.push(tempArray);
          tempArray = []
        }
      }
      log.info('Scrape Finished')
      return recipes;
    })
};

exports.phantom = async function (searchTerm) {
  var website = url+searchTerm+"#!q='search%3D"+searchTerm+"%26Collection%3DHealthy%26DietaryOption%3Dnut+free'"
  var recipes = []
  var tempArray = []
  log.info("Phantom Start")

    const instance = await phantom.create();
    const page = await instance.createPage();
    page.property('loadImages', false);
    page.property('resourceTimeout', 3000);
    await page.on("onResourceRequested", function(requestData) {
        // console.info('Requesting', requestData.url)
    });


    const status = await page.open(website);
    // console.log(status);

    const content = await page.property('content');
    log.info("Phantom Finished")

    log.info("Cheerio Start")
    var recipeLinks = $('.recipe-link', content);

    for (let i = 0; i < recipeLinks.length; i++) {
      if(recipeLinks[i].attribs.href.substring(0,8) == "/recipes") {
        tempArray.push(recipeLinks[i].attribs.title);
        tempArray.push(recipeLinks[i].attribs.href);
        recipes.push(tempArray);
        tempArray = []
      }
    }
    log.info("Cheerio Finished")
    console.log(recipes)

    await instance.exit();

};