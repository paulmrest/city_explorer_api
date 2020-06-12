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
  //START-CONSOLE-TESTING
  console.log('API get /weather');
  console.log(request.query);
  //END-CONSOLE-TESTING
  getWeatherData(request, response);
})

app.get('/trails', (request, response) => {
  //START-CONSOLE-TESTING
  console.log('API get /trails');
  console.log(request.query);
  //END-CONSOLE-TESTING
  getTrailAndCampgroundData(request, response);
})

app.get('/movies', (request, response) => {
  //START-CONSOLE-TESTING
  console.log('API get /movies');
  console.log(request.query);
  //END-CONSOLE-TESTING
  getMovieData(request, response);
})


app.get('/yelp', (request, response) => {
  //START-CONSOLE-TESTING
  console.log('API get /yelp');
  console.log(request.query);
  //END-CONSOLE-TESTING
  getYelpData(request, response);
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

//location getting and setting in DB
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
      //START-CONSOLE-TESTING
      // console.log('locationWebResults.body[0]:');
      // console.log(locationWebResults.body[0]);
      //END-CONSOLE-TESTING
      const locationObjectFromAPI = new Location(search_query, locationWebResults.body[0]);
      const sqlInsertQuery = 'INSERT INTO locations (search_query, display_name, lat, lon) VALUES ($1, $2, $3, $4)';
      const safeInsertValues = [locationObjectFromAPI.search_query, locationObjectFromAPI.formatted_query, locationObjectFromAPI.latitude, locationObjectFromAPI.longitude];
      client.query(sqlInsertQuery, safeInsertValues)
        .then(() => {
          //START-CONSOLE-TESTING
          // console.log('location object from API:');
          // console.log(locationObjectFromAPI);
          //END-CONSOLE-TESTING
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
  //START-CONSOLE-TESTING
  // console.log('cacheData:');
  // console.log(cacheData);
  // console.log('locationObjectFromCache:');
  // console.log(locationObjectFromCache);
  //END-CONSOLE-TESTING
  response.status(200).send(locationObjectFromCache);
}

//weather getting
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

//trail and campground getting
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

//get movie data
const getMovieData = (request, response) => {
  const search_query = request.query.search_query;
  //START-CONSOLE-TESTING
  // console.log('getMovieData');
  // console.log('request.query:');
  // console.log(request.query);
  // console.log('request.query.search_query:');
  // console.log(request.query.search_query);
  //END-CONSOLE-TESTING

  // let moviesURL = 'https://api.themoviedb.org/3/search/movie?api_key=ea13133c930fcaaf870867acf38f063f&language=en-US&query=seattle&page=1&include_adult=false';
  let moviesURL = 'https://api.themoviedb.org/3/search/movie';
  let moviesQueryParams = {
    api_key: process.env.MOVIE_API_KEY,
    query: search_query,
    language: 'en-US',
    page: '1',
    include_adult: 'false'
  };
  //START-CONSOLE-TESTING
  // console.log('moviesQueryParams:');
  // console.log(moviesQueryParams);
  //END-CONSOLE-TESTING
  superagent.get(moviesURL)
    .query(moviesQueryParams)
    .then(movieDataFromAPI => {
      //START-CONSOLE-TESTING
      // console.log('movieDataFromAPI.body.results:');
      // console.log(movieDataFromAPI.body.results);
      //END-CONSOLE-TESTING
      let movieObjectsFromAPIData = movieDataFromAPI.body.results.map(oneMovie => {
        return new Movie(oneMovie);
      });
      //START-CONSOLE-TESTING
      // console.log('movieObjectsFromAPIData:');
      // console.log(movieObjectsFromAPIData);
      //END-CONSOLE-TESTING
      response.status(200).send(movieObjectsFromAPIData);
    })
    .catch(error => {
      console.log('Error:', error);
      response.status(500).send('Error getting API movie data.');
    });
}

const getYelpData = (request, response) => {
  const yelpURL = 'https://api.yelp.com/v3/businesses/search';
  const yelpQueryParams = {
    latitude: request.query.latitude,
    longitude: request.query.longitude,
    categories: 'Restaurants (restaurants, All)'
  };
  superagent.get(yelpURL)
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .query(yelpQueryParams)
    .then(yelpDataFromAPI => {
      //START-CONSOLE-TESTING
      // console.log('yelpDataFromAPI.body:');
      // console.log(yelpDataFromAPI.body.businesses);
      //END-CONSOLE-TESTING
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
