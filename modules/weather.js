'use strict';

//get weather data from WeatherBit's API
const getWeatherData = (superagent, request, response) => {
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

module.exports.getWeatherData = getWeatherData;

//constructor
function WeatherDay(object) {
  this.forecast = object.weather.description;
  this.time = object.datetime;
}
