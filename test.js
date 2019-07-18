var realFood = require('./realfoodScraper');

var arr = [[1,2,3,4],[5,6,7,8]]

realFood.scrape("chicken").then(function(result) {
    console.log(arr)
    move(arr, 0, 1)
    console.log(arr.pop())
    console.log(arr)





})


function move(array, oldIndex, newIndex) {
    if (newIndex >= array.length) {
        newIndex = array.length - 1;
    }
    array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
    return array;
}