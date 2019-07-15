/* eslint-disable no-console */
/* eslint-disable no-undef */

// var mongoClient = require("mongodb").MongoClient;
// var db = {};

// mongoClient.connect("mongodb://tmptest:kEecgUIWgCcht8qjBhYNDJajOKt0JVj1rynvPPxgsDRv30AL6SLilUVgCjmgGEkT9L2Pnxj8ZiXjjwgvnkfpLw%3D%3D@tmptest.documents.azure.com:10255/?ssl=true", function (err, client) {
// db = client.db("testdatabase");  
// client.close();
// });

const {
    dialogflow,
    Permission,
  } = require('actions-on-google');

const google = dialogflow({debug: true});

var appRouter = function (app) {
    app.get("/", function (req, res) {
         res.status(200).send({ message: 'Welcome to our restful API' });
    });
    google.intent('Default Welcome Intent', (conv) => {
        const name = conv.user.storage.userName;
        if (!name) {
          // Asks the user's permission to know their name, for personalization.
          conv.ask(new Permission({
            context: 'Hi there, to get to know you better',
            permissions: 'NAME',
          }));
        } else {
          conv.ask(`Hi again, ${name}. What's your favorite color?`);
        }
    });
}
module.exports = appRouter;