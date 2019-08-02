const bunyan = require('bunyan');
const log = bunyan.createLogger({name: "info_dbutils"});

var mongoClient = require("mongodb").MongoClient;
var db = {};
mongoClient.connect("mongodb://tmptest:kEecgUIWgCcht8qjBhYNDJajOKt0JVj1rynvPPxgsDRv30AL6SLilUVgCjmgGEkT9L2Pnxj8ZiXjjwgvnkfpLw%3D%3D@tmptest.documents.azure.com:10255/?ssl=true", { useNewUrlParser: true },function (err, client) {
  db = client.db("testdatabase");  
});

exports.updateRecipeInDb = function (conv, userId, date){
  var collection = db.collection('testcollection'); 

  collection.updateOne(
    { "userId": userId , "meals.date": new Date(date).toDateString() },
    { $set: { "meals.$.recipe": conv.data.foodChoice.recipe} },
    { upsert: true },
    function(err, response){
      if (!err) {
        log.info("UPDATE " + response)
      }
  });
}

exports.addToDb = function (conv, userId, date){
  var collection = db.collection('testcollection'); 

  collection.findOneAndUpdate(
    { "userId": userId },
    { $push : {
        "meals": {"date": new Date(date).toDateString(), "recipe": conv.data.foodChoice.recipe}
      }
    },
    { upsert: true },
    function(err, response){
      if (!err) {
        log.info("ADD "+ response)
      }
    });
}

exports.isMeal = function (conv, userId, date){
  var collection = db.collection('testcollection'); 

  return collection.findOne({ "userId": userId , "meals.date": new Date(date).toDateString() })
  .then(function(data) {
    if (data) {
      let dbFood = []
      for (let i = 0; i < data.meals.length; i++) {
        if(data.meals[i].date === (new Date(date).toDateString())){
          dbFood = data.meals[i].recipe
          break}
        }
        return dbFood;
      } else {
        return false;
    }
  });
}

exports.loadPrefences = function (userId) {
  var collection = db.collection('testcollection'); 

  return collection.findOne({ "userId": userId})
  .then(function(data) {
    if (data) {
        if(data.preferences === undefined) {
          return []
        } else {
            return data.preferences;
        }
    } else {
      return [];
    }
  });
}

exports.savePrefences = function (conv, userId) {
  var collection = db.collection('testcollection'); 

  collection.findOneAndUpdate(
    { "userId": userId },
    { $set : {
        "preferences": conv.data.preferences
      }
    },
    { upsert: true },
    function(err, response){
      if (!err) {
        log.info("ADD "+ response)
      }
    });
}

exports.foodDiaryCheck = function (userId, days){
  let today = new Date();
  let diaryArray = [];
  let dates = []
  for (let i = 0; i < days; i++) {
    let newDate = new Date();
    dates.push(newDate.setDate(today.getDate() + i));
    diaryArray.push(this.isMeal(null, userId, newDate));
  }
  return Promise.all(diaryArray)
  .then(function(values){
    let res = []
    for(let i in values) {
      res.push({'recipe': values[i], 'date': dates[i]})
    }
    return res;
  })
}
