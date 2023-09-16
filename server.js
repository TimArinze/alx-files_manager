const express = require('express');

const app = express();
app.use(express.json());

// Require the routes defined in routes/index.js
const routes = require('./routes/index');

const PORT = process.env.PORT || 5000;

app.use('/', routes);

app.listen(PORT, () => {
  console.log('Server running on port 5000');
});
