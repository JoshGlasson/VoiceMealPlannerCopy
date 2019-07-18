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
        productInfo.push(url+recipePic[0].attribs.src);
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


