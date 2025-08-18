
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

const AIO_USERNAME = process.env.AIO_USERNAME;
const AIO_KEY = process.env.AIO_KEY;
const FEED_SERVO = 'servo';


router.post("/open", async (req, res) => {
  try {
    await axios.post(
      `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${FEED_SERVO}/data`,
      { value: 1 }, 
      {
        headers: {
          "X-AIO-Key": AIO_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    res.json({ message: "Servo abierto" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al abrir el servo" });
  }
});

router.get("/estado", async (req, res) => {
  try {
    const response = await axios.get(
      `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${FEED_SERVO}/data/last`,
      {
        headers: { "X-AIO-Key": AIO_KEY }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener estado del servo" });
  }
});



module.exports = router;
