var appRouter = function (app) {
    app.get("/", function (req, res) {
         res.status(200).send({ message: 'Welcome to our restful API' });
    });
    app.get("/getItems/:num", function (req, res) {
         var num =req.params.num;
         var data = {
              'item1': 'http://public-domain-photos.com/free-stock-photos-1/flowers/cactus-76.jpg',
              'item2': 'http://public-domain-photos.com/free-stock-photos-1/flowers/cactus-77.jpg',
              'item3': 'http://public-domain-photos.com/free-stock-photos-1/flowers/cactus-78.jpg'
         }     
         res.status(200).send(data);
    });
    app.get("/getText/:txt", function (req, res) {
         var text =req.params.txt;
         var data = {
              'text': text
         }
         res.status(200).send(data);
    });
}
module.exports = appRouter;