'use strict';

//get movie data from The Movie Database's API
const getMovieData = (superagent, request, response) => {
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

module.exports.getMovieData = getMovieData;

//constructor
function Movie(object) {
  this.title = object.title;
  this.overview = object.overview;
  this.average_votes = object.vote_average;
  this.total_votes = object.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500${object.poster_path}`;
  this.popularity = object.popularity;
  this.released_on = object.release_date;
}