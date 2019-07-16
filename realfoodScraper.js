const rp = require('request-promise');
const $ = require('cheerio');
const url = "https://realfood.tesco.com/search.html?search=";
const bunyan = require('bunyan');
const log = bunyan.createLogger({name: "scrape"});


exports.scrape = function (searchTerm) {
  log.info('Start Scrape')
  var recipes = []
  var website = url+searchTerm
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


