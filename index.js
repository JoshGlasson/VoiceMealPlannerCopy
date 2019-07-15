import express from 'express';
import { ping } from './routes/decisions';
import { json } from 'body-parser';

var app = express();
app.use(json());

app.get('/api/ping', ping);

app.listen(7054, function(err){
  if (!err) {
    console.log("Tesco Meal Planner API is listening on port 7054...");
  }
});

