'use strict';

//get Yelp data from their Fusion API
const getYelpData = (superagent, request, response) => {
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

module.exports.getYelpData = getYelpData;

//constructor
function YelpBusiness(object) {
  this.name = object.name;
  this.image_url = object.image_url;
  this.price = object.price;
  this.rating = object.rating;
  this.url = object.url;
}
