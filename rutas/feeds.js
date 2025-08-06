const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

const AIO_USERNAME = process.env.AIO_USERNAME;
const AIO_KEY = process.env.AIO_KEY;


router.get('/', async (req, res) => {
  try {
    const response = await axios.get(`https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds`, {
      headers: {
        'X-AIO-Key': AIO_KEY
      }
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
      name: name,
      description: description || ''
    }, {
      headers: {
        'X-AIO-Key': AIO_KEY,
        'Content-Type': 'application/json'
      }
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

  if (!name && !description) {
    return res.status(400).json({ message: 'Debe enviar al menos "name" o "description"' });
  }

  const feedData = {};
  if (name) feedData.name = name;
  if (description) feedData.description = description;

  try {
    const response = await axios.patch(
      `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${key}`,
      { feed: feedData },  
      {
        headers: {
          'X-AIO-Key': AIO_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      console.error('Error al actualizar feed:', error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error('Error desconocido al actualizar feed:', error.message);
      res.status(500).json({ message: 'Error desconocido al actualizar feed' });
    }
  }
});





 router.get('/:key', async (req, res) => {
  const { key } = req.params;

  try {
    const response = await axios.get(`https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${key}`, {
      headers: {
        'X-AIO-Key': AIO_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      console.error('Error al obtener feed:', error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error('Error desconocido al obtener feed:', error.message);
      res.status(500).json({ message: 'Error desconocido al obtener feed' });
    }
  }
});

router.delete('/:key', async (req, res) => {
  const { key } = req.params;

  try {
    const response = await axios.delete(`https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${key}`, {
      headers: {
        'X-AIO-Key': AIO_KEY
      }
    });

    res.json({ message: `Feed '${key}' eliminado correctamente.` });
  } catch (error) {
    if (error.response) {
      console.error('🔴 Error Adafruit IO:', error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error('🛑 Error desconocido:', error.message);
      res.status(500).json({ message: 'Error desconocido al eliminar feed' });
    }
  }

});

router.get('/:key/data', async (req, res) => {
  const { key } = req.params;

  try {
    const response = await axios.get(`https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${key}/data?limit=30`, {
      headers: {
        'X-AIO-Key': AIO_KEY
      }
    });

    res.json(response.data); 
  } catch (error) {
    console.error('Error al obtener datos del feed:', error.message);
    res.status(500).json({ message: 'Error al obtener datos del feed' });
  }
});
module.exports = router;
