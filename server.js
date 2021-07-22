require('dotenv').config();
const express = require('express');
const cors = require('cors');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const app = express();


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});




const myURI = process.env['DB_URI']


mongoose.connect(myURI, {useNewUrlParser: true, useUnifiedTopology: true});

var urlSchema = new mongoose.Schema({
  original: {type: String, required: true},
  short: Number
})

var Url = mongoose.model('Url', urlSchema)

var bodyParser = require('body-parser')

var responseObject = {}

mongoose.set('useFindAndModify', false);

app.post('/api/shorturl', bodyParser.urlencoded({ extended: false }), (req, res) =>{
  var inputUrl = req.body['url']

  var urlRegex = new RegExp(/^[http://www.]/gi)

  if(!inputUrl.match(urlRegex)) {
    res.json({error: 'Invalid URL'})
    return
  }

  responseObject['original_url'] = inputUrl

  var inputShort = 1

  Url.findOne({})
      .sort({short: 'desc'})
      .exec((error, result) => {
        if (!error && result != undefined) {
          inputShort = result.short + 1
        }
        if (!error) {
          Url.findOneAndUpdate(
            {original: inputUrl},
            {original: inputUrl, short: inputShort},
            {new: true, upsert: true},
            (error, savedUrl) => {
              if(!error){
                responseObject['short_url'] = savedUrl.short
                res.json(responseObject)
              }
            }
            )
        }
      })

  
})

app.get('/api/shorturl/:input', (req, res) => {
  var input = req.params.input

  Url.findOne({short: input}, (error, result) => {
    if (!error && result != undefined) {
      res.redirect(result.original)
    } else {
      res.json('Url not found')
    }
  })
})