/**
 * RUTAS E AUTENTICACIÓN
 * ======================================
 * Define los endpoints para registrar login y gestion de perfil
 */

// Importar router de express
const express = require('express');
const router = express.Router();

const [
    registrarse,
    iniciar_Sesion,
    obtenerme,
    actualizarme,
    cambiarContrasenas

] = require('../controllers/auth.controller');

const {verificarToken} = require('../middleware/auth');

/**
 * RUTAS PUBLICAS
 */

router.post('/register', registrarse);
router.post('/login', iniciar_Sesion);

/**
 * RUTAS PRIVADAS
 */
router.get('/me', verificarToken, obtenerme);
router.put('/me', verificarToken, actualizarme);
router.patch('/me/password', verificarToken, cambiarContrasenas);

module.exports = router;