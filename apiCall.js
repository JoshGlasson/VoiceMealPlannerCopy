const rp = require('request-promise');
const bunyan = require('bunyan');
const log = bunyan.createLogger({name: "api_call"});

const apiKey = process.env.REALFOOD_API_KEY;


exports.searchRecipes = function(searchTerm, parameters, top = 50){
    let filter = concatParameters(parameters)
    var options = { method: 'GET',
        url: `https://tescomealplannertest.search.windows.net/indexes/recipeindex/docs?api-version=2019-05-06&$count=true&search=${searchTerm}${(filter === "" ? '' : `&$filter=${filter}`)}&$top=${top}`,
        // qs: { 'api-version': '2019-05-06', search: searchTerm, '$count': "true", '$filter': filter },
        headers: {
            Accept: '*/*',
            'Content-Type': 'application/json',
            'api-key': apiKey 
        } 
    };
    log.info(options)
    log.info("Pre Call")
    return rp(options)
    .then(function(result){
        log.info("Call Finished")
        var jsonResult = JSON.parse(result)
        return jsonResult.value
    })
}
function concatParameters(parameters){
    let filter = "tags/dinner eq 'True'"
    if(parameters && parameters.length > 0){
        filter = filter + ' and '
        parameters.forEach(param => {
            filter = `${filter}tags/${param} eq 'True' and `
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
        url: `https://tescomealplannertest.search.windows.net/indexes/recipeindex/docs?api-version=2019-05-06&$count=true&search="${recipeName}"`,
        // qs: { 'api-version': '2019-05-06', search: `%22${recipeName}%22`, '$count': "true" },
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
        return jsonResult.value[0]
    })
}

