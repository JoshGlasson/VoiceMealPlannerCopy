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
      for (let i = 0; i < $('.recipe-link', html).length; i++) {
        if($('.recipe-link',html)[i].attribs.href.substring(0,8) == "/recipes") {
          tempArray.push($('.recipe-link',html)[i].attribs.title);
          tempArray.push($('.recipe-link',html)[i].attribs.href);
          recipes.push(tempArray);
          tempArray = []
          break
        }
      }
      log.info('Scrape Finished')
      return recipes;
    })
};


