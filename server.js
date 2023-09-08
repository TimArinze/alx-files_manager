const express = require('express');

const app = express();
app.use(express.json());

// Require the routes defined in routes/index.js
const routes = require('./routes/index');

app.use('/', routes);

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
