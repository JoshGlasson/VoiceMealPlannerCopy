const rp = require('request-promise');
const bunyan = require('bunyan');
const log = bunyan.createLogger({name: "api_call"});

const apiKey = "F40FD4C81C095B2EA51C78AD3D676237"


exports.searchRecipes = function(searchTerm, parameters){
   let filter = concatParameters(parameters)
    var options = { method: 'GET',
        url: 'https://tescomealplannertest.search.windows.net/indexes/recipeindextagfilter/docs',
        qs: { 'api-version': '2019-05-06', search: searchTerm, '$count': "true", '$filter': filter },
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
       console.log(jsonResult)
       return jsonResult.value
    })
}
function concatParameters(parameters){
    let filter = "tags/lunch ne 'NOTAG'" // parameter to don't filter anything
    if(parameters){
        filter = ""
        parameters.forEach(param => {
            filter = filter + "tags/" + param + " eq 'True' and "
        });
        if(filter != "") {
            filter = filter.slice(0,-5)
            log.info(filter)
        }
    }
    return filter
}

exports.getRecipeInfo = function(recipeName){
    var options = { method: 'GET',
        url: 'https://tescomealplannertest.search.windows.net/indexes/recipeindextagfilter/docs',
        qs: { 'api-version': '2019-05-06', search: '%22'+recipeName+'%22', '$count': "true" },
        headers: {
            Accept: '*/*',
            'Content-Type': 'application/json',
            'api-key': apiKey 
        } 
    };

    return rp(options)
    .then(function(result){
       log.info("Call Finished")
       var jsonResult = JSON.parse(result)
    //    info(jsonResult.value[0])
       return jsonResult.value[0]
    })
}
