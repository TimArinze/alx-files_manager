const express = require('express');
const bodyParser = require('body-parser');

const app = express();
// const jsonParser = bodyParser.json();

// app.use(jsonParser);

// Require the routes defined in routes/index.js
const routes = require('./routes/index');

app.use('/', routes);

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
