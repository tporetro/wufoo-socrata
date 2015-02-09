var express = require('express'),
  bodyParser = require('body-parser'),
  moment = require('moment'),
  request = require('request'),
  fs = require('fs'),
  dotenv = require('dotenv');

dotenv.load();

var app = express();

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var server = app.listen(process.env.PORT || 5000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("Node app listening on port " + port + "...");
});

//POST endpoint for webhook
app.post('/',function (req, res) {
  console.log("Received webhook from Wufoo with the following payload:")
  console.log(req.body);

  res.status(204).json({});
  var payload = transformPayload(req.body); //transform the data (valid dates, concatenate address, etc)

  var payloadArray = []; //push our object to an array for POSTing
  payloadArray.push(payload);

  postToSocrata(payloadArray); //POST to Socrata

});

function transformPayload(payload) { //use this to transform the Wufoo Data into a JSON payload that Socrata can consume

  newPayload = {};

  newPayload.event_title = payload.Field1;

  newPayload.start_date = parseDate(payload.Field2);

  newPayload.end_date = parseDate(payload.Field3);

  newPayload.location_name = payload.Field4;

  newPayload.location_address = payload.Field5 + ", " 
    + payload.Field6 + ", "
    + payload.Field7 + ", "
    + payload.Field8 + ", "
    + payload.Field9 + ", "
    + payload.Field10;

  newPayload.description = payload.Field11;

  return newPayload;

};

function parseDate(d) { //converts YYYYmmdd to ISO8601 Date like 2015-02-09T02:54:51+00:00
    var date = new Date(d.substr(0,4)+"/"+d.substr(4,2)+"/"+d.substr(6,2));
    date = moment(date);
    return date.format();
}

function postToSocrata(payloadArray) {
  var sodaURL = 'https://stubox2.demo.socrata.com/resource/h3er-sksi.json';

  console.log("Posting the following Payload to " + sodaURL)
  console.log(payloadArray);

  request.post({
    headers: {
      'X-App-Token' : process.env.SOCRATATOKEN,
      'Authorization' : 'Basic ' + new Buffer(process.env.SOCRATALOGIN + ':' + process.env.SOCRATAPASSWORD).toString('base64')
    },
    url: sodaURL,
    body:    JSON.stringify(payloadArray)
  }, function(error, response, body){
    console.log("The server responded: ");
    console.log(body);
  });
};


