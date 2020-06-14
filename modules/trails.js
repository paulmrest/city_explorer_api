'use strict;'

//get trail and campground data from Hiking Project's API
const getTrailsData = (superagent, request, response) => {
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
        return new Trail(oneTrailOrCampground);
      });
      response.status(200).send(locationTrailsFromQuery);
    })
    .catch(error => {
      console.log('Error:', error);
      response.status(500).send('Error getting superagent trail data.');
    });
}

module.exports.getTrailsData = getTrailsData;

//constructor
function Trail(object) {
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
  const conditionDateTimeArray = object.conditionDate.split(' ');
  this.condition_date = conditionDateTimeArray[0];
  this.condition_time = conditionDateTimeArray[1];
}
