const rp = require('request-promise');
const bunyan = require('bunyan');
const log = bunyan.createLogger({name: "api_call"});
const apiKey = "F40FD4C81C095B2EA51C78AD3D676237"

exports.searchRecipes = async function(searchTerm, parameters){
	let filter = concatParameters(parameters)
	var options = { method: 'GET',
		url: `https://tescomealplannertest.search.windows.net/indexes/recipeindex/docs?api-version=2019-05-06&$count=true&search=${searchTerm}${(filter === "" ? '' : `&$filter=${filter}`)}`,
		// qs: { 'api-version': '2019-05-06', search: searchTerm, '$count': "true", '$filter': filter },
		headers: {
		Accept: '*/*',
			'Content-Type': 'application/json',
			'api-key': apiKey 
		} 
	};

	let result = await rp(options)
	var jsonResult = JSON.parse(result)
	return jsonResult.value
}

function concatParameters(parameters){
	let filter = ""
	if(parameters && parameters.length > 0){
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

exports.getRecipeInfo = async function(recipeName){
	var options = { method: 'GET',
		url: `https://tescomealplannertest.search.windows.net/indexes/recipeindex/docs?api-version=2019-05-06&$count=true&search="${recipeName}"`,
		// qs: { 'api-version': '2019-05-06', search: `%22${recipeName}%22`, '$count': "true" },
		headers: {
		Accept: '*/*',
			'Content-Type': 'application/json',
			'api-key': apiKey 
		} 
	};

	let result = await rp(options)
	var jsonResult = JSON.parse(result)
	return jsonResult.value[0]
}

