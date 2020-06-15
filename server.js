'use strict';

var express     = require('express');
var bodyParser  = require('body-parser');
var cors        = require('cors');
var helmet = require('helmet');

require('dotenv').config();

var apiRoutes         = require('./routes/api.js');

var app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(helmet.xssFilter());

app.use((req, res, next) => {
  console.log(req.path + ' ' + req.method);
  next();
})

//Sample front-end
app.route('/:project/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/issue.html');
  });

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//Routing for API 
apiRoutes(app);

//Start our server and tests!
app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port " + process.env.PORT);
});

module.exports = app; //for testing
