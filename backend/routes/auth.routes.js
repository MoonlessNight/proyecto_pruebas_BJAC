/**
 * RUTAS E AUTENTICACIÓN
 * ======================================
 * Define los endpoints para registrar login y gestion de perfil
 */

// Importar router de express
const express = require('express');
const router = express.Router();

const {
    registrarUsuario,
    iniciarSesion,
    obtenerPerfil,
    actualizarPerfil,
    cambiarContrasena

} = require('../controllers/auth.controller');

const {verificarToken} = require('../middleware/auth');

/**
 * RUTAS PUBLICAS
 */

router.post('/register', registrarUsuario);
router.post('/login', iniciarSesion);

/**
 * RUTAS PRIVADAS
 */
router.get('/me', verificarToken, obtenerPerfil);
router.put('/me', verificarToken, actualizarPerfil);
router.patch('/me/password', verificarToken, cambiarContrasena);

module.exports = router;