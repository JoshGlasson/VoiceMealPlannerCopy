const rp = require('request-promise');
const bunyan = require('bunyan');
const log = bunyan.createLogger({name: "api_call"});

const apiKey = "F40FD4C81C095B2EA51C78AD3D676237"


exports.getRecipes = function(searchTerm){
    const random = Math.floor(Math.random()*30)
    var options = { method: 'GET',
        url: 'https://tescomealplannertest.search.windows.net/indexes/recipeindextagfilter/docs',
        qs: { 'api-version': '2019-05-06', search: searchTerm, '$count': "true" },
        headers: {
            Accept: '*/*',
            'Content-Type': 'application/json',
            'api-key': apiKey 
        } 
    };

    log.info("Pre Call")
    return rp(options)
    .then(function(result){
       log.info("Call Finished")
       var jsonResult = JSON.parse(result)
       console.log(jsonResult.value)
       return jsonResult.value
    })

}