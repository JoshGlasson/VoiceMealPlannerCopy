'use strict'
const generateUUID = require('uuid/v4');

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

