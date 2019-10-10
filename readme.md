# Tesco Meal Planner API

API for the Tesco Meal Planner Google Assistant Action.

## Test Google Assistant Using Local API

Run `npm install -g ngrok` to enable testing locally. Use `nodemon index.js` to run API server.

More information [here](https://www.freecodecamp.org/news/how-to-implement-local-fulfillment-for-google-assistant-actions-using-dialogflow-1b3b3a13075f/)


## Files Explained

#### apiCall.js
This file is where we made the call to the API we had set up on Azure which was linked to our database. In order to set up the API I had to create and index to make the database searchable.
The `searchRecipes` method is the one that goes to the API and performs the search, parsing the JSON response into a usable format and returning.
Filters could be added to the end of the query string, so the `concatParameters` method is there to put them together into a searchable format.
`getRecipeInfo` was used if we needed to find a specific recipes information based on the name. Each recipe has a unique name so this was the easiest way to search.


#### dbutils.js
Basically a helper method containing all of the various calls to our database that we needed to make. If a user wanted to save, update or remove preferences or meals, one of these methods would be called to do so. Connecting to the database is also handled in here at the top. 
The key for the database was stored as an ENV variable on Azure.


#### helpers.js
In here we placed various helper methods in order to keep our main index file a bit cleaner.


#### index.js
This is the main file where all of the intents are handled. Every part of the conversation is routed through here. Any connections to Dialogflow or Actions on Google are also made in here. 


The `realFoodScraper.js` and `prodInfoScraper.js` files were originally used when we were live scraping the website. They are now redundant but I didn't want to remove them!
