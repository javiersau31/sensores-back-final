const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const authRoutes = require('./rutas/auth');
const temperaturaRoutes = require('./rutas/temperatura');
const feedsRoutes = require('./rutas/feeds');
const sensoresRoutes = require('./rutas/sensores');
const servoRoutes = require('./rutas/servo');
const AIO_USERNAME = process.env.AIO_USERNAME;
const AIO_KEY = process.env.AIO_KEY;

app.use(cors());
app.use(express.json());

app.use('/api/temperatura', temperaturaRoutes);

app.use('/api/feeds', feedsRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/sensores', sensoresRoutes);

app.use('/api/servo', servoRoutes);


app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${process.env.PORT}`);
});
