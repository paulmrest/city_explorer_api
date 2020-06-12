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
  getLocationData(request, response);
})

app.get('/weather', (request, response) => {
  getWeatherData(request, response);
})

app.get('/trails', (request, response) => {
  getTrailAndCampgroundData(request, response);
})

app.get('/movies', (request, response) => {
  getMovieData(request, response);
})

app.get('/yelp', (request, response) => {
  getYelpData(request, response);
})

app.get('*', (request, response) => {
  invalidAPIPathError(response);
})

//turn on server
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Listening on ${PORT}`);
    })
  })

//get location data
const getLocationData = (request, response) => {
  const search_query = request.query.city;
  //SQL query and safe values for sanitization using pg library
  const sqlSelectQuery = 'SELECT "search_query", "display_name", "lat", "lon" FROM "locations" WHERE "locations"."search_query" = ($1);'
  const safeSelectValues = [search_query];
  //get data from SQL DB using pg
  client.query(sqlSelectQuery, safeSelectValues)
    .then((result) => {
      //if data not already in DB, get data from API and write to DB
      if (result.rows.length === 0)
      {
        fetchDataFromAPI(search_query, response);
      }
      //else use data from DB
      {
        handleDataFromCache(search_query, result.rows[0], response);
      }
    })
    .catch((error) =>
    {
      console.error('Error retreiving location data from cache.');
      console.error(error);
    });
}

//get location data from LocationIQ's API and write to the DB
const fetchDataFromAPI = (search_query, response) => {
  let locationURL = 'https://us1.locationiq.com/v1/search.php';
  const locationAPIQueryParms = {
    key: process.env.GEOCODE_API_KEY,
    q: search_query,
    format: 'json',
    limit: 1
  };
  superagent.get(locationURL)
    .query(locationAPIQueryParms)
    .then(locationWebResults => {
      const locationObjectFromAPI = new Location(search_query, locationWebResults.body[0]);
      const sqlInsertQuery = 'INSERT INTO locations (search_query, display_name, lat, lon) VALUES ($1, $2, $3, $4)';
      const safeInsertValues = [locationObjectFromAPI.search_query, locationObjectFromAPI.formatted_query, locationObjectFromAPI.latitude, locationObjectFromAPI.longitude];
      client.query(sqlInsertQuery, safeInsertValues)
        .then(() => {
          response.status(200).send(locationObjectFromAPI);
        })
    })
    .catch(error => {
      console.error('Error fetching location data from location API.');
      console.error(error);
    });
}

const handleDataFromCache = (search_query, cacheData, response) => {
  const locationObjectFromCache = new Location(cacheData.search_query, cacheData);
  response.status(200).send(locationObjectFromCache);
}

//get weather data from WeatherBit's API
const getWeatherData = (request, response) => {
  //API URL and query object
  let weatherURL = 'https://api.weatherbit.io/v2.0/forecast/daily';
  const weatherAPIQueryParams = {
    lat: request.query.latitude,
    lon: request.query.longitude,
    key: process.env.WEATHER_API_KEY
  };
  //call to SuperAgent library for data from API
  superagent.get(weatherURL)
    .query(weatherAPIQueryParams)
    .then(locationWeatherResults => {
      let locationWeatherFromQuery = locationWeatherResults.body.data.map(oneWeatherDay => {
        return new WeatherDay(oneWeatherDay);
      });
      response.status(200).send(locationWeatherFromQuery);
    })
    .catch(error => {
      console.log('Error:', error);
      response.status(500).send('Error getting superagent weather data.');
    });
}

//get trail and campground data from Hiking Project's API
const getTrailAndCampgroundData = (request, response) => {
  //trail and campground API URL and query object
  let trailsURL = 'https://www.hikingproject.com/data/get-trails';
  const trailAndCampgroundQueryParams = {
    lat: request.query.latitude,
    lon: request.query.longitude,
    key: process.env.TRAIL_API_KEY
  };
  //call to SuperAgent library for data from API
  superagent.get(trailsURL)
    .query(trailAndCampgroundQueryParams)
    .then(locationTrailsResults => {
      let locationTrailsFromQuery = locationTrailsResults.body.trails.map(oneTrailOrCampground => {
        return new TrailOrCampground(oneTrailOrCampground);
      });
      response.status(200).send(locationTrailsFromQuery);
    })
    .catch(error => {
      console.log('Error:', error);
      response.status(500).send('Error getting superagent trail data.');
    });
}

//get movie data from The Movie Database's API
const getMovieData = (request, response) => {
  //setup URL
  const search_query = request.query.search_query;
  let moviesURL = 'https://api.themoviedb.org/3/search/movie';
  let moviesQueryParams = {
    api_key: process.env.MOVIE_API_KEY,
    query: search_query,
    language: 'en-US',
    page: '1',
    include_adult: 'false'
  };
  //get data from API using SuperAgent
  superagent.get(moviesURL)
    .query(moviesQueryParams)
    .then(movieDataFromAPI => {
      let movieObjectsFromAPIData = movieDataFromAPI.body.results.map(oneMovie => {
        return new Movie(oneMovie);
      });
      response.status(200).send(movieObjectsFromAPIData);
    })
    .catch(error => {
      console.log('Error:', error);
      response.status(500).send('Error getting API movie data.');
    });
}

//get Yelp data from their Fusion API
const getYelpData = (request, response) => {
  //allow for pagination from front-end
  const numPerPage = 10;
  const currPage = request.query.page;
  const currOffset = (currPage - 1) * numPerPage;
  //setup URL
  const yelpURL = 'https://api.yelp.com/v3/businesses/search';
  const yelpQueryParams = {
    latitude: request.query.latitude,
    longitude: request.query.longitude,
    categories: 'Restaurants (restaurants, All)',
    offset: currOffset,
    limit: currOffset + numPerPage
  };
  //get data from API using SuperAgent
  superagent.get(yelpURL)
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .query(yelpQueryParams)
    .then(yelpDataFromAPI => {
      let yelpObjectsFromAPIData = yelpDataFromAPI.body.businesses.map(oneBusiness => {
        return new YelpBusiness(oneBusiness);
      });
      response.status(200).send(yelpObjectsFromAPIData);
    })
    .catch(error => {
      console.log('Error:', error);
      response.status(500).send('Error getting Yelp data.');
    });
}

const invalidAPIPathError = response => {
  response.status(404).send('Invalid API path.');
}

//constructors
function Location(searchQuery, object) {
  this.search_query = searchQuery;
  this.formatted_query = object.display_name;
  this.latitude = object.lat;
  this.longitude = object.lon;
}

function WeatherDay(object) {
  this.forecast = object.weather.description;
  this.time = object.datetime;
}

function TrailOrCampground(object) {
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

function Movie(object) {
  this.title = object.title;
  this.overview = object.overview;
  this.average_votes = object.vote_average;
  this.total_votes = object.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500${object.poster_path}`;
  this.popularity = object.popularity;
  this.released_on = object.release_date;
}

function YelpBusiness(object) {
  this.name = object.name;
  this.image_url = object.image_url;
  this.price = object.price;
  this.rating = object.rating;
  this.url = object.url;
}
