const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

const AIO_USERNAME = process.env.AIO_USERNAME;
const AIO_KEY = process.env.AIO_KEY;


let feedsCache = null;
let cacheTimestamp = 0;
const cacheTTL = 15000; 


router.get('/', async (req, res) => {
  const ahora = Date.now();
  if (feedsCache && (ahora - cacheTimestamp < cacheTTL)) {
    return res.json(feedsCache);
  }

  try {
    const feedsRes = await axios.get(`https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds`, {
      headers: { 'X-AIO-Key': AIO_KEY }
    });

    const feeds = feedsRes.data;
    const feedsConDatos = await Promise.all(
      feeds.map(async (feed) => {
        const datosRes = await axios.get(`https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${feed.key}/data?limit=1`, {
          headers: { 'X-AIO-Key': AIO_KEY }
        });
        return {
          ...feed,
          datos: datosRes.data
        };
      })
    );

    feedsCache = feedsConDatos;
    cacheTimestamp = ahora;

    res.json(feedsConDatos);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Error al obtener feeds y datos' });
  }
});

// PATCH -> actualizar dato, sin cache
router.patch('/:feedKey/:dataId', async (req, res) => {
  const { feedKey, dataId } = req.params;
  const { value } = req.body;

  try {
    const response = await axios.patch(
      `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${feedKey}/data/${dataId}`,
      { value },
      { headers: { 'X-AIO-Key': AIO_KEY } }
    );

    // Opcional: invalidar cache si se actualizó algo
    feedsCache = null;

    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Error al actualizar el dato' });
  }
});

// DELETE -> eliminar dato, sin cache
router.delete('/:feedKey/:dataId', async (req, res) => {
  const { feedKey, dataId } = req.params;

  try {
    await axios.delete(
      `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${feedKey}/data/${dataId}`,
      { headers: { 'X-AIO-Key': AIO_KEY } }
    );

    // Invalidar cache
    feedsCache = null;

    res.json({ message: 'Dato eliminado correctamente' });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Error al eliminar el dato' });
  }
});

module.exports = router;
