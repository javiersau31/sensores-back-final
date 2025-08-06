const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config();

const router = express.Router();


router.post('/register', async (req, res) => {
  const { nombre, usuario, contrasena } = req.body;
  const hash = await bcrypt.hash(contrasena, 10);

  const sql = 'INSERT INTO usuarios (nombre, usuario, contrasena) VALUES (?, ?, ?)';
  db.query(sql, [nombre, usuario, hash], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ mensaje: 'Usuario registrado con éxito' });
  });
});


router.post('/login', (req, res) => {
  const { usuario, contrasena } = req.body;

  const sql = 'SELECT * FROM usuarios WHERE usuario = ?';
  db.query(sql, [usuario], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).json({ mensaje: 'Usuario no encontrado' });

    const user = results[0];
    const match = await bcrypt.compare(contrasena, user.contrasena);
    if (!match) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user.id, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '4h' });
    res.json({ mensaje: 'Login exitoso', token });
  });
});

module.exports = router;
