// import { MongoClient as mongoClient } from 'mongodb';

// var mongoDb = {};
// mongoClient.connect('mongodb://localhost:27017', function(err, client){
//   if (!err) {
//     console.log('Connected to MongoDB!');
//     mongoDb = client.db('freshco');
//   }
// }); 

export function ping(req, res){
  res.status(200).send('Hello');
}