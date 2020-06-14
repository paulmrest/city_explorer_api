'use strict';

//setup
const express = require('express');
const app = express();
const superagent = require('superagent');
const pg = require('pg');

require('dotenv').config();

const cors = require('cors');
app.use(cors());

const pgClient = new pg.Client(process.env.DATABASE_URL);
pgClient.on('error', error => console.error(error));

const PORT = process.env.PORT || 3001;

const location = require('./modules/location.js');
const weather = require('./modules/weather.js');
const trails = require('./modules/trails.js');
const movies = require('./modules/movie.js');
const yelp = require('./modules/yelp.js');
const invalidPath = require('./modules/invalid-path.js');

//API paths
app.get('/location', (request, response) => {
  location.getLocationData(superagent, pgClient, request, response);
})

app.get('/weather', (request, response) => {
  weather.getWeatherData(superagent, request, response);
})

app.get('/trails', (request, response) => {
  trails.getTrailsData(superagent, request, response);
})

app.get('/movies', (request, response) => {
  movies.getMovieData(superagent, request, response);
})

app.get('/yelp', (request, response) => {
  yelp.getYelpData(superagent, request, response);
})

app.get('*', (request, response) => {
  invalidPath.invalidAPIPathError(response);
})

//turn on server
pgClient.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Listening on ${PORT}`);
    })
  })
