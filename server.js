'use strict';

const express = require('express');
const app = express();

require('dotenv').config();

const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
})

app.get('/location', (request, response) => {
  let search_query = request.query.city;
  let geoData = require('./data/location.json');
  let returnObject = new Location(search_query, geoData[0]);
  response.status(200).send(returnObject);
})

function Location(searchQuery, object) {
  this.search_query = searchQuery;
  this.formatted_query = object.display_name;
  this.latitude = object.lat;
  this.longitude = object.lon;
}
