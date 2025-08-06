const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

const AIO_USERNAME = process.env.AIO_USERNAME;
const AIO_KEY = process.env.AIO_KEY;

router.get('/dht', async (req, res) => {
  try {
    const [tempRes, humRes] = await Promise.all([
      axios.get(`https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/temperatura/data/last`, {
        headers: { 'X-AIO-Key': AIO_KEY }
      }),
      axios.get(`https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/humedad/data/last`, {
        headers: { 'X-AIO-Key': AIO_KEY }
      })
    ]);

    res.json({
      temperatura: tempRes.data.value,
      humedad: humRes.data.value
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener datos de Adafruit IO' });
  }
});

module.exports = router;
