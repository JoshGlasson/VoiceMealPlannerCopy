var appRouter = function (app) {
    app.get("/", function (req, res) {
         res.status(200).send({ message: 'Welcome to our restful API' });
    });
    app.get("/getText/:txt", function (req, res) {
         var text =req.params.txt;
         var data = {
              'text': text
         }
         res.status(200).send(data);
    });
    app.get("/ping", function (req, res) {
        res.status(200).send({ message: 'Hello' });
   });
}
module.exports = appRouter;