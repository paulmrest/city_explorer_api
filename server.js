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

app.get('/weather', (request, response) => {
  try
  {
    let weatherURL = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${request.query.latitude}&lon=${request.query.longitude}&key=${process.env.WEATHER_API_KEY}`;
    superagent.get(weatherURL)
      .then(locationWeatherResults => {
        let locationWeatherFromQuery = locationWeatherResults.body.data.map(oneWeatherDay => {
          return new WeatherDay(request.query.search_query, oneWeatherDay);
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

app.get('/trails', (request, response) => {
  try
  {
    let trailsURL = `https://www.hikingproject.com/data/get-trails?lat=${request.query.latitude}&lon=${request.query.longitude}&key=${process.env.TRAIL_API_KEY}`;
    superagent.get(trailsURL)
      .then(locationTrailsResults => {
        let locationTrailsFromQuery = locationTrailsResults.body.trails.map(oneTrailOrCampground => {
          return new TrailOrCampground(request.query.search_query, oneTrailOrCampground);
        });
        response.status(200).send(locationTrailsFromQuery);
      })
      .catch(error => {
        console.log('Error:', error);
        response.status(500).send('Error getting superagent trail data.');
      });
  }
  catch (error)
  {
    console.log('Error:', error);
    response.status(500).send('Error getting trails.');
  }
})

//error function
app.get('*', (request, response) => {
  response.status(404).send('Unknown API call.');
})


function Location(searchQuery, object) {
  this.search_query = searchQuery;
  this.formatted_query = object.display_name;
  this.latitude = object.lat;
  this.longitude = object.lon;
}

function WeatherDay(searchQuery, object) {
  this.search_query = searchQuery;
  this.forecast = object.weather.description;
  this.time = object.datetime;
}

function TrailOrCampground(searchQuery, object) {
  this.search_query = searchQuery;
  this.name = object.name;
  this.location = object.location;
  this.length = object.length;
  this.stars = object.stars;
  this.star_votes = object.starVotes;
  this.summary = object.summary;
  this.trail_url = object.url;
  this.conditions = object.conditionDetails;
  const conditionDateTime = new Date(object.conditionDate);
  this.condition_date = yearMonthDayString(conditionDateTime);
  this.condition_time = twelveHourTimeString(conditionDateTime);
}

const yearMonthDayString = (date) => {
  const monthInt = date.getMonth() + 1;
  const monthString = monthInt >= 10 ? `${monthInt}` : `0${monthInt}`;
  const dayInt = date.getDate();
  const dayString = dayInt >= 10 ? `${dayInt}` : `0${dayInt}`;
  return `${date.getFullYear()}-${monthString}-${dayString}`;
};

const twelveHourTimeString = (date) => {
  const hourInt = date.getHours();
  const hourString = hourInt >= 10 ? `${hourInt}` : `0${hourInt}`;
  const minuteInt = date.getMinutes();
  const minuteString = minuteInt >= 10 ? `${minuteInt}` : `0${minuteInt}`;
  const secondInt = date.getSeconds();
  const secondString = secondInt >= 10 ? `${secondInt}` : `0${secondInt}`;
  return `${hourString}:${minuteString}:${secondString}`;
};
