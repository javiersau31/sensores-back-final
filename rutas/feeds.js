const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();
const AIO_USERNAME = process.env.AIO_USERNAME;
const AIO_KEY = process.env.AIO_KEY;


let cache = {};
let cacheTimestamps = {};
const CACHE_INTERVAL = 15000; 


async function getCachedFeedData(feedKey, last=false) {
  const ahora = Date.now();
  const cacheKey = last ? `${feedKey}-last` : feedKey;

  if (!cache[cacheKey] || (ahora - (cacheTimestamps[cacheKey] || 0)) > CACHE_INTERVAL) {
    try {
      const url = last
        ? `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${feedKey}/data/last`
        : `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${feedKey}/data?limit=5`;

      const response = await axios.get(url, {
        headers: { 'X-AIO-Key': AIO_KEY }
      });

      cache[cacheKey] = response.data;
      cacheTimestamps[cacheKey] = ahora;
    } catch (error) {
      console.error(`Error al obtener datos de ${feedKey}:`, error.message);
      throw error;
    }
  }

  return cache[cacheKey];
}

//feeds generales
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(`https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds`, {
      headers: { 'X-AIO-Key': AIO_KEY }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error al obtener feeds:', error.message);
    res.status(500).json({ message: 'Error al obtener feeds de Adafruit IO' });
  }
});

router.post('/', async (req, res) => {
  const { name, description } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ message: 'El nombre del feed es requerido y debe ser una cadena' });
  }

  try {
    const response = await axios.post(`https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds`, {
      name,
      description: description || ''
    }, {
      headers: { 'X-AIO-Key': AIO_KEY, 'Content-Type': 'application/json' }
    });
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error al crear feed:', error.message);
    res.status(500).json({ message: 'Error al crear feed en Adafruit IO' });
  }
});

router.patch('/:key', async (req, res) => {
  const { key } = req.params;
  const { name, description } = req.body;
  if (!name && !description) return res.status(400).json({ message: 'Debe enviar al menos "name" o "description"' });

  const feedData = {};
  if (name) feedData.name = name;
  if (description) feedData.description = description;

  try {
    const response = await axios.patch(
      `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${key}`,
      { feed: feedData },
      { headers: { 'X-AIO-Key': AIO_KEY, 'Content-Type': 'application/json' } }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error al actualizar feed:', error.response?.status, error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error desconocido al actualizar feed' });
  }
});

router.get('/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const response = await axios.get(`https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${key}`, {
      headers: { 'X-AIO-Key': AIO_KEY }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error al obtener feed:', error.response?.status, error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error desconocido al obtener feed' });
  }
});

router.delete('/:key', async (req, res) => {
  const { key } = req.params;
  try {
    await axios.delete(`https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${key}`, {
      headers: { 'X-AIO-Key': AIO_KEY }
    });
    res.json({ message: `Feed '${key}' eliminado correctamente.` });
  } catch (error) {
    console.error('Error al eliminar feed:', error.response?.status, error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error desconocido al eliminar feed' });
  }
});

// Datos por feed 
router.get('/:key/data', async (req, res) => {
  const { key } = req.params;
  try {
    const datos = await getCachedFeedData(key);
    res.json(datos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener datos del feed' });
  }
});

// feed con ultimo dato
router.get('/presencia/latest', async (req, res) => {
  try {
    const datos = await getCachedFeedData('presencia', true);
    res.json(datos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener último dato de presencia' });
  }
});

router.get('/gas/latest', async (req, res) => {
  try {
    const datos = await getCachedFeedData('gas', true);
    res.json(datos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener último dato de gas' });
  }
});

router.get('/presencia-control/estado', async (req, res) => {
  try {
    const datos = await getCachedFeedData('presencia-control', true);
    res.json(datos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estado de presencia-control' });
  }
});

router.post('/presencia-control/estado', async (req, res) => {
  const { activo } = req.body;
  if (typeof activo !== 'boolean' && typeof activo !== 'number') {
    return res.status(400).json({ message: 'Debe enviar un valor booleano o numérico para "activo"' });
  }
  const valor = typeof activo === 'boolean' ? (activo ? 1 : 0) : activo;

  try {
    const response = await axios.post(
      `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/presencia-control/data`,
      { value: valor },
      { headers: { 'X-AIO-Key': AIO_KEY } }
    );
  
    cache['presencia-control-last'] = { value: valor };
    cacheTimestamps['presencia-control-last'] = Date.now();

    res.json({ message: `Sensor presencia-control actualizado a ${valor}`, data: response.data });
  } catch (error) {
    console.error('Error al actualizar presencia-control:', error.message);
    res.status(500).json({ message: 'Error al actualizar presencia-control' });
  }
});

module.exports = router;
