const rp = require('request-promise');
const $ = require('cheerio');
const url = "https://realfood.tesco.com/search.html?search=";


exports.scrape = async function (searchTerm) {
  var recipes = []
  var website = url+searchTerm
  const html = await rp(website);
  var tempArray = [];
  for (let i = 0; i < $('.recipe-link', html).length; i++) {
    if ($('.recipe-link', html)[i].attribs.href.substring(0, 8) == "/recipes") {
      tempArray.push($('.recipe-link', html)[i].attribs.title);
      tempArray.push($('.recipe-link', html)[i].attribs.href);
      recipes.push(tempArray);
      tempArray = [];
    }
  }
  return recipes;
};


