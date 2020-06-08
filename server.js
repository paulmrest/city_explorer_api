'use strict';

const express = require('express');
const app = express();

require('dotenv').config();

const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 3001;

//proof of life code
app.get('/', (request, response) => {
  response.send('I\'m alive!');
})

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
})
