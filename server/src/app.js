const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { clientUrl } = require('./config/env');

const app = express();

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
