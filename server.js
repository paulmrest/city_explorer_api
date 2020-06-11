'use strict';

const express = require('express');
const app = express();
const superagent = require('superagent');
const pg = require('pg');

require('dotenv').config();

const cors = require('cors');
app.use(cors());

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', error => console.error(error));

const PORT = process.env.PORT || 3001;

//API paths
app.get('/location', (request, response) => {
  //START-CONSOLE-TESTING
  console.log('API get /location:');
  console.log(request.query);
  //END-CONSOLE-TESTING
  getLocationData(request, response);
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

//error handling
app.get('*', (request, response) => {
  response.status(404).send('Unknown API call.');
})

//turn on server
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Listening on ${PORT}`);
    })
  })

//database caching
const getLocationData = (request, response) => {
  const sqlSelectQuery = 'SELECT "search_query", "display_name", "lat", "lon" FROM "locations" WHERE "locations"."search_query" = ($1);'
  const safeSelectValues = [request.query.city];
  client.query(sqlSelectQuery, safeSelectValues)
    .then((result) => {
      if (result.rows.length === 0)
      {
        fetchDataFromAPI(request, response);
      }
      else
      {
        handleDataFromCache(result.rows[0], response);
      }
    })
    .catch((error) =>
    {
      console.error('Error retreiving location data from cache.');
      console.error(error);
    });
};

const fetchDataFromAPI = (request, response) => {
  let search_query = request.query.city;
  let locationURL = `https://us1.locationiq.com/v1/search.php?key=${process.env.GEOCODE_API_KEY}&q=${search_query}&format=json`;
  superagent.get(locationURL)
    .then(locationWebResults => {
      //START-CONSOLE-TESTING
      console.log('locationWebResults.body[0]:');
      console.log(locationWebResults.body[0]);
      //END-CONSOLE-TESTING
      const locationObjectFromAPI = new Location(search_query, locationWebResults.body[0]);
      const sqlInsertQuery = 'INSERT INTO locations (search_query, display_name, lat, lon) VALUES ($1, $2, $3, $4)';
      const safeInsertValues = [locationObjectFromAPI.search_query, locationObjectFromAPI.formatted_query, locationObjectFromAPI.latitude, locationObjectFromAPI.longitude];
      client.query(sqlInsertQuery, safeInsertValues)
        .then(() => {
          //START-CONSOLE-TESTING
          console.log('location object from API:');
          console.log(locationObjectFromAPI);
          //END-CONSOLE-TESTING
          response.status(200).send(locationObjectFromAPI);
        })
    })
    .catch(error => {
      console.error('Error fetching location data from API.');
      console.error(error);
    });
}

const handleDataFromCache = (cacheData, response) => {
  const locationObjectFromCache = new Location(cacheData.search_query, cacheData);
  //START-CONSOLE-TESTING
  console.log('cacheData:');
  console.log(cacheData);
  console.log('locationObjectFromCache:');
  console.log(locationObjectFromCache);
  //END-CONSOLE-TESTING
  response.status(200).send(locationObjectFromCache);
}

//constructors
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
  //We are assuming that the conditionDate property is a string
  //of the format 'YYYY-MM-DD HH-MM-SS'
  this.condition_date = object.conditionDate.split(' ')[0];
  this.condition_time = object.conditionDate.split(' ')[1];
}
