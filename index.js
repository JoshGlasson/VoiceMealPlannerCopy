/* eslint-disable no-undef */
/* eslint-disable no-console */
const express = require('express');
const bodyParser = require('body-parser');
const {dialogflow} = require('actions-on-google');

const port = process.env.PORT || 4567;

const app = dialogflow();

app.intent('Default Welcome Intent', conv => {
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

const expressApp = express().use(bodyParser.json());

expressApp.post('/api/test', app);
expressApp.listen(port);