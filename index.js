import express from 'express';
import { ping, test } from './routes/decisions';
import { json } from 'body-parser';

var port = process.env.port || 7054

var app = express();
app.use(json());

app.get('/api/ping', ping);
app.post('/api/test', test);

app.listen(port, function(err){
  if (!err) {
    console.log("Tesco Meal Planner API is listening on port 7054...");
  }
});

