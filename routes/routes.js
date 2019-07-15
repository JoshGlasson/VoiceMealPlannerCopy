/* eslint-disable no-console */
/* eslint-disable no-undef */

var mongoClient = require('mongodb').MongoClient

var mongoDb = {};
mongoClient.connect('mongodb://tmptest:kEecgUIWgCcht8qjBhYNDJajOKt0JVj1rynvPPxgsDRv30AL6SLilUVgCjmgGEkT9L2Pnxj8ZiXjjwgvnkfpLw==@tmptest.documents.azure.com:10255/?ssl=true', function(err, client){
  if (!err) {
    console.log('Connected to MongoDB!');
    mongoDb = client.db('tmp');
  }
});

var appRouter = function (app) {
    app.get("/", function (req, res) {
         res.status(200).send({ message: 'Welcome to our restful API' });
    });
    app.get("/getText/:txt", function (req, res) {
         var text =req.params.txt;
         var data = {
              'text': text
         }
         res.status(200).send(data);
    });
    app.get("/ping", function (req, res) {
        res.status(200).send({ message: 'Hello' });
    });
    app.post("/test", function(req, res){

        var googleRequest = mongoDb.collection('requestData');
        
        googleRequest.insertOne(req.body, function(err, response){
            if (!err) {
                res.sendStatus(201);
                console.log(response)
            }
        });
    });
}
module.exports = appRouter;