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
    { "userId": userId , "meals.date": date.toDateString() },
    { $set: { "meals.$.recipe": conv.data.foodChoice} },
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
        "meals": {"date": date.toDateString(), "recipe": conv.data.foodChoice}
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

  return collection.findOne({ "userId": userId , "meals.date": date.toDateString() })
  .then(function(data) {
    if (data) {
      return data;
    } else {
      return false;
    }
  });
}