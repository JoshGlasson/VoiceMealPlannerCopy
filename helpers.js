'use strict'
const generateUUID = require('uuid/v4');

const preferencesNames = {
  dairyFree: "dairy free",
  diabetic: "low sugar",
  eggFree: "eggs free",
  glutenFree: "gluten free",
  healthyRecipies: "healthy",
  lowCalorie: "low calories",
  lowFat: "low fat",
  nutFree: "nut free",
  vegan: "vegan",
  vegetarian: "vegetarian",
  wheatFree: "wheat free"
}

exports.readParameters = function (parameters){
  let speech = ""
  if(parameters && parameters.length > 0){
    // speech = speech + ' and '
    for(let index in parameters) {
      if(parameters.length === 1) {
        speech = speech + `${preferencesNames[parameters[index]]} `
      } else {
          if(index < parameters.length -1) {
            speech = speech + `${preferencesNames[parameters[index]]}, `
          } else {
            speech = speech.slice(0,-2)
            speech = speech + ` or ${preferencesNames[parameters[index]]}`
          }
        }
    }
  }
  return speech
}

exports.move = function (array, oldIndex, newIndex){
    if(newIndex >= array.length) {
      newIndex = array.length - 1;
    }
    array.splice(newIndex,0,array.splice(oldIndex, 1)[0])
    return array;
  }

  exports.checkUserId = function (conv, userId){
    if ('userId' in conv.user.storage) {
      userId = conv.user.storage.userId;
    } else {
      userId = generateUUID();
      conv.user.storage.userId = userId
    }
    return userId;
  }

exports.inputParameters = function (input) {
  var parameters = `{"inputs": [
    {
      "intent": "actions.intent.TEXT",
      "rawInputs": [
        {
          "inputType": "KEYBOARD",
          "query": "${input}"
        }
      ],
      "arguments": [
        {
          "name": "text",
          "rawText": "${input}",
          "textValue": "${input}"
        }
      ]
    }]}`
      return parameters
}

console.log(this.readParameters(["vegan"]))