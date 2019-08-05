const bunyan = require('bunyan');
const log = bunyan.createLogger({name: "info_dbutils"});
var mongoClient = require("mongodb").MongoClient;

var collection = null;

exports.connectDB = async function() {
  let client = await mongoClient.connect("mongodb://tmptest:kEecgUIWgCcht8qjBhYNDJajOKt0JVj1rynvPPxgsDRv30AL6SLilUVgCjmgGEkT9L2Pnxj8ZiXjjwgvnkfpLw%3D%3D@tmptest.documents.azure.com:10255/?ssl=true", { useNewUrlParser: true })
  let db = await client.db("testdatabase");
  collection =  await db.collection('testcollection');
}

exports.updateRecipeInDb = function (conv, userId, date){

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

exports.isMeal = async function (conv, userId, date){
  let data = await collection.findOne({ "userId": userId , "meals.date": new Date(date).toDateString() })
  if (data) {
    let dbFood = []
    for (let meal of data.meals) {
      if(meal.date === (new Date(date).toDateString())){
        dbFood = meal.recipe
        break
      }
    }
    return dbFood;
    } else {
      return false;
  }
}

exports.loadPrefences = async function (userId) {
  let data = await collection.findOne({ "userId": userId})
  if (data) {
    if(data.preferences === undefined) {
      return []
    } else {
      return data.preferences;
    }
  } else {
    return [];
  }
}

exports.savePrefences = function (conv, userId) {
  // var collection = db.collection('testcollection'); 

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

exports.foodDiaryCheck = async function (userId, days){
  let today = new Date();
  let diaryArray = [];
  let dates = []
  for (let i = 0; i < days; i++) {
    let newDate = new Date();
    dates.push(newDate.setDate(today.getDate() + i));
    diaryArray.push(this.isMeal(null, userId, newDate));
  }
  let mealNames = await Promise.all(diaryArray)
  let res = []
  for(let i in mealNames) {
    res.push({'recipe': mealNames[i], 'date': dates[i]})
  }
  return res;
}

exports.deleteMeal = function (conv, userId, date){
  collection.findOneAndUpdate(
    { "userId": userId },
    { $pull : {
        "meals": {date: new Date(date).toDateString()}
      }
    },
    function(err, response){
      if (!err) {
        log.info("REMOVE "+ response)
      }
    });
}
