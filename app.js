/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var request = require('request');
// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

var fs = require('fs');
var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');

var nlu = new NaturalLanguageUnderstandingV1({
  username: '86cc548d-74b5-411d-b7bb-d25881a32ffd',
  password: 'QHkpJNzlhke2',
  version_date: NaturalLanguageUnderstandingV1.VERSION_DATE_2017_02_27
});

var weather_host = appEnv.services["weatherinsights"]
        ? appEnv.services["weatherinsights"][0].credentials.url // Insights for Weather credentials passed in
        : ""; // or copy your credentials url here for standalone

function weatherAPI(path, qs, done) {
    var url = weather_host + path;
   // console.log(url, qs);
    request({
        url: url,
        method: "GET",
        headers: {
            "Content-Type": "application/json;charset=utf-8",
            "Accept": "application/json"
        },
        qs: qs
    }, function(err, req, data) {
        if (err) {
            done(err);
        } else {
            if (req.statusCode >= 200 && req.statusCode < 400) {
                try {
                    done(null, JSON.parse(data));
                } catch(e) {
                    console.log(e);
                    done(e);
                }
            } else {
                console.log(err);
                done({ message: req.statusCode, data: data });
            }
        }
    });
}

app.post('/api/observations/current', function(req, res) {
    console.log('latitude:'+req.query.latitude+' longitude:' + req.query.longitude);
    weatherAPI("/api/weather/v1/geocode/" + req.query.latitude + "/" + req.query.longitude + "/observations.json?language=en-US&units=m", null, function(err, result) {
        if (err) {
            res.send(err).status(400);
        } else {
        	var weather_data = {
        		feels_like: result.observation.feels_like,
        		wx_phrase: result.observation.wx_phrase,
        		temp: result.observation.temp
        	}
        	console.log("JSON:"+JSON.stringify(result));
            res.json(weather_data);
        }
    });
});

app.post('/sentiment', function(req,res) {

	var bodytext = req.query.bodytext;

  nlu.analyze({
    'text': bodytext, // Buffer or String
    'features': {
      'sentiment': {}
    }
  }, function(err, response) {
       if (err)
         console.log('error:', err);
       else
         res.status(200).send(response.sentiment.document).end();
   });

});

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
