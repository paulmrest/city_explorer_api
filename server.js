'use strict';

const express = require('express');
const app = express();
const superagent = require('superagent');

require('dotenv').config();

const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
})

app.get('/location', (request, response) => {
  try
  {
    let search_query = request.query.city;
    let locationURL = `https://us1.locationiq.com/v1/search.php?key=${process.env.GEOCODE_API_KEY}&q=${search_query}&format=json`;
    superagent.get(locationURL)
      .then(locationWebResults => {
        let locationFromQuery = new Location(search_query, locationWebResults.body[0]);
        response.status(200).send(locationFromQuery);
      })
      .catch(error => {
        console.log('Error:', error);
        response.status(500).send('Error getting superagent location data.');
      });
  }
  catch (error)
  {
    console.log('Error:', error);
    response.status(500).send('Error getting location.');
  }
})

function Location(searchQuery, object) {
  this.search_query = searchQuery;
  this.formatted_query = object.display_name;
  this.latitude = object.lat;
  this.longitude = object.lon;
}

app.get('/weather', (request, response) => {
  try
  {
    let search_query = request.query.search_query;
    let weatherURL = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${request.query.latitude}&lon=${request.query.longitude}&key=${process.env.WEATHER_API_KEY}`;
    superagent.get(weatherURL)
      .then(locationWeatherResults => {
        let locationWeatherFromQuery = locationWeatherResults.body.data.map(oneWeatherDay => {
          return new WeatherDay(search_query, oneWeatherDay);
        });
        response.status(200).send(locationWeatherFromQuery);
      })
      .catch(error => {
        console.log('Error:', error);
        response.status(500).send('Error getting superagent weather data.');
      });
  }
  catch (error)
  {
    console.log('Error:', error);
    response.status(500).send('Error getting weather.');
  }
})

function WeatherDay(searchQuery, object) {
  this.search_query = searchQuery;
  this.forecast = object.weather.description;
  this.time = object.datetime;
}

//error function
app.get('*', (request, response) => {
  response.status(404).send('Unknown API call.');
})
