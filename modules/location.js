'use strict';

//get location data
const getLocationData = (superagent, pgClient, request, response) => {
  const search_query = request.query.city;
  //SQL query and safe values for sanitization using pg library
  const sqlSelectQuery = 'SELECT "search_query", "display_name", "lat", "lon" FROM "locations" WHERE "locations"."search_query" = ($1);'
  const safeSelectValues = [search_query];
  //get data from SQL DB using pg
  pgClient.query(sqlSelectQuery, safeSelectValues)
    .then((result) => {
      //if data not already in DB, get data from API and write to DB
      if (result.rows.length === 0)
      {
        fetchDataFromAPI(superagent, pgClient, search_query, response);
      }
      //use data from DB
      else
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
const fetchDataFromAPI = (superagent, pgClient, search_query, response) => {
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
      console.log('fetchDataFromAPI...');
      console.log('just before the constructor...');
      //END-CONSOLE-TESTING
      const locationObjectFromAPI = new Location(search_query, locationWebResults.body[0]);
      const sqlInsertQuery = 'INSERT INTO locations (search_query, display_name, lat, lon) VALUES ($1, $2, $3, $4)';
      const safeInsertValues = [locationObjectFromAPI.search_query, locationObjectFromAPI.formatted_query, locationObjectFromAPI.latitude, locationObjectFromAPI.longitude];
      pgClient.query(sqlInsertQuery, safeInsertValues)
        .then(() => {
          response.status(200).send(locationObjectFromAPI);
        })
        .catch(error => {
          console.error('Error writing data to cache.');
          console.error(error);
        })
    })
    .catch(error => {
      console.error('Error fetching location data from location API.');
      console.error(error);
    });
}

const handleDataFromCache = (search_query, cacheData, response) => {
  const locationObjectFromCache = new Location(search_query, cacheData);
  response.status(200).send(locationObjectFromCache);
}

module.exports.getLocationData = getLocationData;

//constructor
function Location(searchQuery, object) {
  this.search_query = searchQuery;
  this.formatted_query = object.display_name;
  this.latitude = object.lat;
  this.longitude = object.lon;
}
