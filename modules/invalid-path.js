'use strict';

const invalidAPIPathError = response => {
  response.status(404).send('Invalid API path.');
}

module.exports.invalidAPIPathError = invalidAPIPathError;
