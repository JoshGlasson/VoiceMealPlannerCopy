const rp = require('request-promise');
const $ = require('cheerio');
const url = "https://realfood.tesco.com/search.html?search=";
var recipes = []


  exports.scrape = function (searchTerm) {
    var website = url+searchTerm
    return rp(website)
      .then(function(html){
        var tempArray = []
        for (let i = 0; i < $('.recipe-link', html).length; i++) {
          if($('.recipe-link',html)[i].attribs.href.substring(0,8) == "/recipes") {
            tempArray.push($('.recipe-link',html)[i].attribs.title);
            tempArray.push($('.recipe-link',html)[i].attribs.href);
            recipes.push(tempArray);
            tempArray = []
          }
        }
        return recipes;
      })
  };


