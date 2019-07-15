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

export function test(req, res){
    var requestText = req.body;
    console.log(requestText);
    res.sendStatus(200)
}