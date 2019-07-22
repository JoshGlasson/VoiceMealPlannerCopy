const rp = require('request-promise');
const bunyan = require('bunyan');
const log = bunyan.createLogger({name: "api_call"});

const apiKey = "4dc30dcddaef4d1e5112579b1a046e18"
const appId = "c95a1779"

exports.getRecipes = function(searchTerm){
    const random = Math.floor(Math.random()*30)
    var apiCall = "https://api.edamam.com/search?q="+searchTerm+"&app_id="+appId+"&app_key="+apiKey+"&from="+random+"&to="+(random+1)
    log.info("Pre Call")
    return rp(apiCall)
    .then(function(result){
       log.info("Call Finished")
       var jsonResult = JSON.parse(result)
       return jsonResult.hits[0].recipe
    })

}