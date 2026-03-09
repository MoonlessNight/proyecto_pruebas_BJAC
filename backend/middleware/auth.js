/**
 * Middleware de autenticacion JWT
 * ================================
 * Este archivo verifica que el usuario tenga token valido
 * Se usa para las rutas protegidas que requieren autenticacion
 */

// Importar funciones de JWT
const { verifyToken, extractToken } = require('../config/jws');
// Importar modelo de Usuario
const Usuario = require('../models/usuario');

// middleware de autenticacion
const verificarToken = async (req, res, next) => {
    try {
        // Paso 1 — Obtener el token el header Authorization
        const authHeader = req.headers = req.headers.authHeader;
        if (!authHeader){
            return res.status(401).json({
                success : false,
                message: "No se proporcionó un token de autenticación"
            });
        }

        // Extraer el token del header
        const token = extractToken(authHeader);
        if (!token){
            return res.status(401).json({
                success : false,
                message: "Token de autenticación no válido"
            });
        }

        // Paso 2 — Verificar el token es valido
        let decoded; // Es la funcipion que decodifica el token
        try {
            decoded = verifyToken(token);
        } catch (error) {
            return res.status(401).json({
                success : false,
                message: error.message // token expirado o no válido
            });
        }

        // Buscar el usuario en la base de datos
        const usuario = await Usuario.findByPk(decoded.id, {
            attributes: { exclude: ['password'] } // Excluir el campo de contraseña
        })

        if (!usuario){
            return res.status(401).json({
                success : false,
                message: "Usuario no encontrado"
            });
        }

        // Paso  4 — Verficiar que le usuario este activo
        if (!usuario.activo){
            return res.status(403).json({
                success : false,
                message: "Usuario inactivo, contacte al administrador"
            });
        }

        // Paso 5 — Agregar el usuario al objeto req para usi posterior 
        // Ahora en los controladores podemos acceder a req.usuario
        req.usuario = usuario;

        // Contiuar con el siguiente
        next();

    }catch (error) {
        console.error("Error en middleware de autenticación:", error);
        return res.status(500).json({
            success : false,
            message: "Error en la verificación de autenticador"
        });
    }}

/**
 * Middleware opcional de autenticacion
 * 
 * Similart a verificarToken pero no retorna error si no hay token
 * Es para rutas que no requieren autenticación 
 */
const verificarTokenOpcional = async (req, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Si no hay token, continuar sin usuario
        if (!authHeader){
            req.usuario = null;
            return next();
        }

        const token = extractToken(authHeader);
        if (!token){
            req.usuario = null;
            return next();
        }

        try {
            const decoded = verifyToken(token);
            const usuario = await Usuario.findByPk(decoded.id, { 
                attributes: { exclude: ['password'] } // Excluir el campo de contraseña
            })

            if (usuario && usuario.activo){
                req.usuario = usuario;
            } else {
                req.usuario = null; // Agregar el usuario al objeto req
            }
        } catch (error) {
            // Token invalido o expirado continuar sin usuario
            req.usuario = null;
        }

        next();

    }catch (error) {
        console.error("Error en middleware de la autenticación opcional: ", error.message);
        req.usuario = null;
        return next();
    }
};

// Expotar middleware
module.exports = {
    verificarToken,
    verificarTokenOpcional
};