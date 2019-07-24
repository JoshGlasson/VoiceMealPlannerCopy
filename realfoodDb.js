const bunyan = require('bunyan');
const log = bunyan.createLogger({name: "db_create"});
const Nightmare = require('nightmare');
const $ = require('cheerio');

var mongoClient = require("mongodb").MongoClient;
var db = {};
mongoClient.connect("mongodb://tmptest:kEecgUIWgCcht8qjBhYNDJajOKt0JVj1rynvPPxgsDRv30AL6SLilUVgCjmgGEkT9L2Pnxj8ZiXjjwgvnkfpLw%3D%3D@tmptest.documents.azure.com:10255/?ssl=true", { useNewUrlParser: true },function (err, client) {
  db = client.db("foodDB");
  db.collection('foodDB').count().then(function(result){console.log(result)})
});

async function scrapeAll(){
    for (let i = 1; i <21; i++) {
        var url = "https://realfood.tesco.com/search.html?#!q='selectedobjecttype%3DRECIPES%26page%3D"+i+"%26perpage%3D30"+"%26Occasion%3D"+"Christmas"+"%26SubType%3DRECIPE'"
        await addToDb(url)
    }
}

function nightmareScrape(website) {
    console.log(website)
    log.info("Start Nightmare")
    return new Nightmare ({loadTimeout: 0})
      .goto(website)
      .wait('body')
      .evaluate(() => document.querySelector('body').innerHTML)
      .end()
      .then(response => {
        log.info("Nightmare Finished")
        return cheerio(response)
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
    //   var recipePic = $('.recipe-list-item-visual img', data);
  
      for (let i = 0; i < recipeList.length; i++) {
        if(recipeLinks[i].attribs.href.substring(0,8) == "/recipes") {
          tempArray.push(recipeLinks[i].attribs.title);
          tempArray.push(recipeLinks[i].attribs.href);
        //   tempArray.push(recipeList[i].attribs["data-objecttype"]);
        //   tempArray.push(recipeList[i].attribs["data-cookingtime"]);
        //   tempArray.push(recipeList[i].attribs["data-summary"].toString().replace(/(<strong>|<\/strong>)/gm,''));
        //   tempArray.push(recipeList[i].attribs["data-serves"]);
        //   tempArray.push(recipeList[i].attribs["data-calories"]);
        //   tempArray.push(recipeList[i].attribs["data-freezable"]);
        //   tempArray.push(recipeList[i].attribs["data-healthy"]);
        //   tempArray.push((recipePic[i].attribs.src).replace(" ", "%20"));
          recipes.push(tempArray);
          tempArray = []
        }
      }
    log.info("Cheerio Finished")
    console.log(recipes)
    return recipes;
  }

function addToDb(url){
    return nightmareScrape(url)
    .then(function(result){
        for (let i = 0; i < result.length; i++) {
            log.info("Start Saving to DB")
            var collection = db.collection('foodDB'); 
            collection.findOneAndUpdate(
            { "recipe": result[i][0] },
            { $set : {
                "tags.christmas": true
                }
            },
            { upsert: true },
            function(err, response){
                if (!err) {
                log.info("Finished Saving to DB")
                log.info(response)
                log.info(collection.count().then(function(result){console.log(result)}))
                } else {
                    log.info("Finished Saving to DB")
                    log.info(err)
                    log.info(collection.count().then(function(result){console.log(result)}))
                }
            });
            }
        })
  }

  scrapeAll()



 /* Add all to DB
  function addToDb(url){
    return nightmareScrape(url)
    .then(function(result){
        for (let i = 0; i < result.length; i++) {
            log.info("Start Saving to DB")
            var collection = db.collection('foodDB'); 
            collection.findOneAndUpdate(
            { "recipe": result[i][0] },
            { $set : {
                "details": {
                    "href": result[i][1], 
                    "recipeType": result[i][2], 
                    "cookingTime": result[i][3], 
                    "summary": result[i][4], 
                    "serves": result[i][5], 
                    "calories": result[i][6], 
                    "freezable": result[i][7], 
                    "healthy": result[i][8], 
                    "imageLink": result[i][9]
                }
            }},
            { upsert: true },
            function(err, response){
                if (!err) {
                log.info("Finished Saving to DB")
                log.info(response)
                log.info(collection.count().then(function(result){console.log(result)}))
                } else {
                    log.info("Finished Saving to DB")
                    log.info(err)
                    log.info(collection.count().then(function(result){console.log(result)}))
                }
            });
            }
        })
  }
  */